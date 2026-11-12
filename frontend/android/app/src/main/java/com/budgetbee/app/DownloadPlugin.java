package com.budgetbee.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(
    name = "Download",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class DownloadPlugin extends Plugin {

    private static final String CHANNEL_ID = "budgetbee_downloads";
    private static final int NOTIFICATION_ID = 2001;

    private final ExecutorService executor =
        Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        super.load();
        createNotificationChannel();
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 &&
            getPermissionState("notifications") != PermissionState.GRANTED) {

            requestPermissionForAlias(
                "notifications",
                call,
                "notificationPermissionCallback"
            );
            return;
        }

        startSaving(call);
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        // File saving must still work if notifications are denied.
        startSaving(call);
    }

    private void startSaving(PluginCall call) {
        executor.execute(() -> writeFile(call));
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager =
                (NotificationManager) getContext()
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "BudgetBee Downloads",
                NotificationManager.IMPORTANCE_LOW
            );

            channel.setDescription(
                "Financial report download progress and completion"
            );

            manager.createNotificationChannel(channel);
        }
    }

    private boolean canNotify() {
        return Build.VERSION.SDK_INT < 33 ||
            getContext().checkSelfPermission(
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED;
    }

    private void showProgress(String filename, int percent) {
        if (!canNotify()) return;

        Notification notification =
            new Notification.Builder(getContext(), CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle("BudgetBee - Downloading report")
                .setContentText(filename + " - " + percent + "%")
                .setProgress(100, percent, false)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();

        NotificationManager manager =
            (NotificationManager) getContext()
                .getSystemService(Context.NOTIFICATION_SERVICE);

        manager.notify(NOTIFICATION_ID, notification);
    }

    private void showCompleted(String filename) {
        if (!canNotify()) return;

        Notification notification =
            new Notification.Builder(getContext(), CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle("BudgetBee - Download complete")
                .setContentText(filename + " saved to Downloads/BudgetBee")
                .setProgress(0, 0, false)
                .setOngoing(false)
                .setAutoCancel(true)
                .build();

        NotificationManager manager =
            (NotificationManager) getContext()
                .getSystemService(Context.NOTIFICATION_SERVICE);

        manager.notify(NOTIFICATION_ID, notification);
    }

    private void showFailed() {
        if (!canNotify()) return;

        Notification notification =
            new Notification.Builder(getContext(), CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_notify_error)
                .setContentTitle("BudgetBee - Download failed")
                .setContentText("Unable to save financial report")
                .setOngoing(false)
                .setAutoCancel(true)
                .build();

        NotificationManager manager =
            (NotificationManager) getContext()
                .getSystemService(Context.NOTIFICATION_SERVICE);

        manager.notify(NOTIFICATION_ID, notification);
    }

    private void writeFile(PluginCall call) {
        String filename = call.getString("filename");
        String base64 = call.getString("base64");
        String mimeType = call.getString("mimeType");

        if (filename == null || filename.isEmpty() ||
            base64 == null || base64.isEmpty()) {
            call.reject("Filename and file content are required.");
            return;
        }

        if (!filename.matches("[A-Za-z0-9._-]+") ||
            filename.equals(".") || filename.equals("..")) {
            call.reject("Invalid filename.");
            return;
        }

        if (mimeType == null || mimeType.isEmpty()) {
            mimeType = "application/octet-stream";
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Android 10 or newer is required.");
            return;
        }

        Uri fileUri = null;

        try {
            byte[] fileBytes = Base64.decode(base64, Base64.DEFAULT);
            int totalBytes = fileBytes.length;

            if (totalBytes == 0) {
                call.reject("Export file is empty.");
                return;
            }

            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
            values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS + "/BudgetBee"
            );
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            fileUri = getContext().getContentResolver().insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            );

            if (fileUri == null) {
                throw new Exception("Unable to create download file.");
            }

            showProgress(filename, 0);

            try (OutputStream output = getContext()
                    .getContentResolver()
                    .openOutputStream(fileUri)) {

                if (output == null) {
                    throw new Exception("Unable to open output stream.");
                }

                int chunkSize = 16 * 1024;
                int writtenBytes = 0;
                int lastPercent = -1;

                while (writtenBytes < totalBytes) {
                    int bytesToWrite = Math.min(
                        chunkSize,
                        totalBytes - writtenBytes
                    );

                    output.write(
                        fileBytes,
                        writtenBytes,
                        bytesToWrite
                    );

                    writtenBytes += bytesToWrite;

                    int percent = (int) (
                        (writtenBytes * 100L) / totalBytes
                    );

                    // Update at most once per 5 percentage points.
                    if (percent >= lastPercent + 5 ||
                        writtenBytes == totalBytes) {

                        showProgress(filename, percent);
                        lastPercent = percent;
                    }
                }

                output.flush();
            }

            ContentValues completed = new ContentValues();
            completed.put(MediaStore.MediaColumns.IS_PENDING, 0);

            getContext().getContentResolver().update(
                fileUri,
                completed,
                null,
                null
            );

            showCompleted(filename);

            JSObject result = new JSObject();
            result.put("filename", filename);
            result.put("uri", fileUri.toString());
            result.put("success", true);

            call.resolve(result);

        } catch (Exception error) {
            if (fileUri != null) {
                getContext().getContentResolver().delete(
                    fileUri,
                    null,
                    null
                );
            }

            showFailed();

            call.reject(
                "Failed to save file: " + error.getMessage(),
                error
            );
        }
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }
}

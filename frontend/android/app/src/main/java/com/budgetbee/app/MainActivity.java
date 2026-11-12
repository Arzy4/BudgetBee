package com.budgetbee.app;

import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.webkit.CookieManager;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.view.ViewTreeObserver;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean wasKeyboardVisible = false;
    private boolean isRestoringFullscreen = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DownloadPlugin.class);
        super.onCreate(savedInstanceState);
        
        configureSystemBars();
        reapplyLegacyFullscreen();
        reapplyImmersiveMode();
        observeKeyboardVisibility();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {

            View decorView = getWindow().getDecorView();
            View webView = getBridge().getWebView();

            // Prevent the WebView from fitting system insets
            webView.setFitsSystemWindows(false);

            if (webView.getParent() instanceof View) {
                View parent = (View) webView.getParent();
                parent.setFitsSystemWindows(false);
            }

            // Diagnostic: prevent the legacy decor layout from
            // passing system-window insets to its children
            decorView.setOnApplyWindowInsetsListener((view, insets) -> {
                return insets.consumeSystemWindowInsets();
            });

            decorView.requestApplyInsets();
        }
    }

    private void reapplyImmersiveMode() {
        View decorView = getWindow().getDecorView();

        decorView.post(() -> {
            if (isFinishing() || isDestroyed()) {
                return;
            }

            configureSystemBars();
            reapplyLegacyFullscreen();
        });
    }

    private void configureSystemBars() {
        Window window = getWindow();

        window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        window.clearFlags(
                android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS
                        | android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

        // Let BudgetBee's cream background show behind system bars
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {

            // Request edge-to-edge layout
            window.setDecorFitsSystemWindows(false);

            window.getDecorView().setOnApplyWindowInsetsListener(
                    (view, insets) -> view.onApplyWindowInsets(insets));

            WindowInsetsController controller = window.getInsetsController();

            if (controller != null) {

                // Hide both the status bar and navigation bar
                controller.hide(
                        WindowInsets.Type.statusBars()
                                | WindowInsets.Type.navigationBars());

                // Dark icons on BudgetBee's cream background
                controller.setSystemBarsAppearance(
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);

                // Request temporary overlay when hidden bars are revealed
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }

        } else {

            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams params = window.getAttributes();

                params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;

                window.setAttributes(params);
            }

            // Android 10 and earlier
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }

    private void reapplyLegacyFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return;
        }

        View decorView = getWindow().getDecorView();

        decorView.post(() -> {
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        });
    }

    private void observeKeyboardVisibility() {
        View decorView = getWindow().getDecorView();

        decorView.getViewTreeObserver()
                .addOnGlobalLayoutListener(
                        new ViewTreeObserver.OnGlobalLayoutListener() {

                            @Override
                            public void onGlobalLayout() {
                                boolean keyboardVisible;

                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                    WindowInsets insets = decorView.getRootWindowInsets();

                                    if (insets == null) {
                                        return;
                                    }

                                    keyboardVisible = insets.isVisible(WindowInsets.Type.ime());

                                } else {
                                    android.graphics.Rect visibleRect = new android.graphics.Rect();

                                    decorView.getWindowVisibleDisplayFrame(visibleRect);

                                    int screenHeight = decorView.getRootView().getHeight();
                                    int keyboardHeight = screenHeight - visibleRect.bottom;

                                    keyboardVisible = keyboardHeight > screenHeight * 0.15;
                                }

                                if (wasKeyboardVisible && !keyboardVisible) {
                                    restoreFullscreenAfterKeyboard();
                                }

                                wasKeyboardVisible = keyboardVisible;
                            }
                        });
    }

    private void restoreFullscreenAfterKeyboard() {
        if (isRestoringFullscreen) {
            return;
        }

        isRestoringFullscreen = true;

        View decorView = getWindow().getDecorView();

        decorView.postDelayed(() -> {
            if (!isFinishing() && !isDestroyed()) {
                reapplyImmersiveMode();
            }

            isRestoringFullscreen = false;
        }, 50);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        if (hasFocus) {
            reapplyImmersiveMode();
        }
    }

    @Override
    public void onResume() {
        super.onResume();

        reapplyImmersiveMode();
    }

    @Override
    public void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    public void onStop() {
        CookieManager.getInstance().flush();
        super.onStop();
    }
}

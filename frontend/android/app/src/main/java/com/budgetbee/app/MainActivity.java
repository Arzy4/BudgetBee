package com.budgetbee.app;

import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.webkit.CookieManager;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();
    }

    private void configureSystemBars() {
        Window window = getWindow();

        window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS
        );

        window.clearFlags(
                android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS
                | android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION
        );

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
                    (view, insets) -> view.onApplyWindowInsets(insets)
            );

            WindowInsetsController controller
                    = window.getInsetsController();

            if (controller != null) {

                // Hide both the status bar and navigation bar
                controller.hide(
                    WindowInsets.Type.statusBars()
                        | WindowInsets.Type.navigationBars()
                );

                // Dark icons on BudgetBee's cream background
                controller.setSystemBarsAppearance(
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );

                // Request temporary overlay when hidden bars are revealed
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }

        } else {

            // Android 10 and earlier
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        // Reapply immersive mode when BudgetBee regains focus
        if (hasFocus) {
            configureSystemBars();
        }
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

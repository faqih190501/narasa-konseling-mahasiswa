package id.ac.narasa.konseling;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String APP_URL = "https://narasa-konseling-mahasiswa.vercel.app/?source=apk";

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout offlineContainer;
    private long lastBackPressTime = 0L;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configureStatusBar();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#FCFBF7"));

        // 1. Main WebView
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#FCFBF7"));
        FrameLayout.LayoutParams webParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        root.addView(webView, webParams);

        // 2. Top Smooth Progress Bar (#2E7D67)
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        Drawable bgProgress = new ColorDrawable(Color.parseColor("#E5E0D5"));
        ClipDrawable fgProgress = new ClipDrawable(
                new ColorDrawable(Color.parseColor("#2E7D67")),
                Gravity.START,
                ClipDrawable.HORIZONTAL
        );
        LayerDrawable progressLayer = new LayerDrawable(new Drawable[]{bgProgress, fgProgress});
        progressLayer.setId(0, android.R.id.background);
        progressLayer.setId(1, android.R.id.progress);
        progressBar.setProgressDrawable(progressLayer);

        FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3),
                Gravity.TOP
        );
        root.addView(progressBar, barParams);

        // 3. Offline / Reconnect View (with Offline Emergency Hotline 119 FR-02)
        offlineContainer = buildOfflineView();
        offlineContainer.setVisibility(View.GONE);
        root.addView(offlineContainer, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);

        setupWebViewSettings();
        setupWebViewClients();

        // Handle deep link URL if opened via external link
        String targetUrl = APP_URL;
        Intent launchIntent = getIntent();
        if (launchIntent != null && Intent.ACTION_VIEW.equals(launchIntent.getAction())) {
            Uri data = launchIntent.getData();
            if (data != null && "narasa-konseling-mahasiswa.vercel.app".equalsIgnoreCase(data.getHost())) {
                targetUrl = data.toString();
            }
        }

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(targetUrl);
        }
    }

    private void configureStatusBar() {
        Window window = getWindow();
        if (window == null) return;
        int creamColor = Color.parseColor("#FCFBF7");
        window.setStatusBarColor(creamColor);
        window.setNavigationBarColor(creamColor);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                );
            }
        } else {
            View decor = window.getDecorView();
            int flags = decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            decor.setSystemUiVisibility(flags);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebViewSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " NarasaAndroidAPK/1.2");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
    }

    private void setupWebViewClients() {
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setProgress(100);
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                offlineContainer.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                return handleCustomUri(request.getUrl());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    webView.setVisibility(View.GONE);
                    offlineContainer.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                if (url == null || url.startsWith("blob:")) {
                    Toast.makeText(MainActivity.this, "Mengekspor berkas...", Toast.LENGTH_SHORT).show();
                    return;
                }
                openExternalUri(Uri.parse(url));
            }
        });
    }

    private boolean handleCustomUri(Uri uri) {
        String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
        String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";

        if ("tel".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_DIAL, uri));
            } catch (Exception e) {
                Toast.makeText(this, "Tidak dapat membuka aplikasi Telepon.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        if ("mailto".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_SENDTO, uri));
            } catch (Exception e) {
                Toast.makeText(this, "Tidak dapat membuka aplikasi Email.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        if ("whatsapp".equals(scheme) || "intent".equals(scheme)) {
            openExternalUri(uri);
            return true;
        }

        if ("http".equals(scheme) || "https".equals(scheme)) {
            if (host.contains("wa.me")
                    || host.contains("whatsapp.com")
                    || host.contains("meet.google.com")) {
                openExternalUri(uri);
                return true;
            }
            return false;
        }

        openExternalUri(uri);
        return true;
    }

    private void openExternalUri(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Aplikasi pendukung belum terpasang di ponsel ini.", Toast.LENGTH_SHORT).show();
        }
    }

    private LinearLayout buildOfflineView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(28), dp(28), dp(28), dp(28));
        box.setBackgroundColor(Color.parseColor("#FCFBF7"));

        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor("#E2F1EC"));
        badgeBg.setCornerRadius(dp(24));

        TextView badge = new TextView(this);
        badge.setText("NARASA • Narasi Rasa");
        badge.setTextSize(12);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setTextColor(Color.parseColor("#2E7D67"));
        badge.setBackground(badgeBg);
        badge.setPadding(dp(16), dp(8), dp(16), dp(8));
        box.addView(badge);

        TextView title = new TextView(this);
        title.setText("Koneksi Internet Terputus");
        title.setTextSize(20);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.parseColor("#2D2A26"));
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleLp.topMargin = dp(16);
        box.addView(title, titleLp);

        TextView subtitle = new TextView(this);
        subtitle.setText("Pastikan Wi-Fi atau Data Seluler Anda aktif untuk terhubung ke Ruang Aman Konseling Mahasiswa BKPI & PIAUD.");
        subtitle.setTextSize(13);
        subtitle.setTextColor(Color.parseColor("#5F544E"));
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        subLp.topMargin = dp(10);
        subLp.bottomMargin = dp(24);
        box.addView(subtitle, subLp);

        // Retry Button
        GradientDrawable retryBg = new GradientDrawable();
        retryBg.setColor(Color.parseColor("#2E7D67"));
        retryBg.setCornerRadius(dp(999));

        Button retryBtn = new Button(this);
        retryBtn.setText("Coba Muat Ulang");
        retryBtn.setAllCaps(false);
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setTypeface(Typeface.DEFAULT_BOLD);
        retryBtn.setBackground(retryBg);
        retryBtn.setPadding(dp(28), dp(12), dp(28), dp(12));
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                offlineContainer.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                webView.reload();
            }
        });
        box.addView(retryBtn, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // Offline Crisis Hotline Button (FR-02 Always Accessible)
        GradientDrawable crisisBg = new GradientDrawable();
        crisisBg.setColor(Color.parseColor("#FFE4E6"));
        crisisBg.setStroke(dp(1), Color.parseColor("#FDA4AF"));
        crisisBg.setCornerRadius(dp(999));

        Button crisisBtn = new Button(this);
        crisisBtn.setText("Darurat / Krisis? Panggil 119 ext. 8");
        crisisBtn.setAllCaps(false);
        crisisBtn.setTextColor(Color.parseColor("#BE123C"));
        crisisBtn.setTypeface(Typeface.DEFAULT_BOLD);
        crisisBtn.setBackground(crisisBg);
        crisisBtn.setPadding(dp(24), dp(12), dp(24), dp(12));
        crisisBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:119")));
                } catch (Exception ignored) {
                }
            }
        });
        LinearLayout.LayoutParams crisisLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        crisisLp.topMargin = dp(12);
        box.addView(crisisBtn, crisisLp);

        return box;
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (offlineContainer != null && offlineContainer.getVisibility() == View.VISIBLE) {
                finish();
                return true;
            }
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
            long now = System.currentTimeMillis();
            if (now - lastBackPressTime < 2000) {
                finish();
            } else {
                lastBackPressTime = now;
                Toast.makeText(this, "Tekan kembali sekali lagi untuk keluar dari NARASA", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}


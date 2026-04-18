import 'dart:async';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class WebViewScrapingService {
  static final WebViewScrapingService _instance = WebViewScrapingService._internal();
  factory WebViewScrapingService() => _instance;
  WebViewScrapingService._internal();

  HeadlessInAppWebView? _headlessWebView;

  /// Loads a URL in a headless webview, waits for completion, and returns HTML.
  Future<String> fetchHtml(String url) async {
    final completer = Completer<String>();
    
    _headlessWebView = HeadlessInAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(url)),
      initialSettings: InAppWebViewSettings(
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        javaScriptEnabled: true,
        useShouldOverrideUrlLoading: true,
        useOnLoadResource: true,
      ),
      onLoadStop: (controller, url) async {
        // Allow time for Cloudflare challenges or dynamic content to settle
        await Future.delayed(const Duration(seconds: 4));
        
        String? html = await controller.getHtml();
        if (html != null && !html.contains("Checking your browser") && !html.contains("just a moment")) {
           if (!completer.isCompleted) completer.complete(html);
        } else {
           // If it's still blocking, we could wait more or signal failure
           // For simplicity, we wait one more time
           await Future.delayed(const Duration(seconds: 5));
           html = await controller.getHtml();
           if (!completer.isCompleted) completer.complete(html ?? "");
        }
      },
      onReceivedError: (controller, request, error) {
        if (!completer.isCompleted) completer.completeError("WebView Error: ${error.description}");
      },
    );

    await _headlessWebView!.run();
    
    try {
      final result = await completer.future.timeout(const Duration(seconds: 30));
      return result;
    } catch (e) {
      rethrow;
    } finally {
      await _headlessWebView?.dispose();
    }
  }
}

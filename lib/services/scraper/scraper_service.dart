import 'package:aura_reader/models/chapter_meta.dart';
import 'package:aura_reader/services/scraper/novel_site_adapter.dart';
import 'package:aura_reader/services/scraper/novel_bin_adapter.dart';
import 'package:aura_reader/services/scraper/webview_scraping_service.dart';
import 'package:dio/dio.dart';

class ScraperService {
  final List<NovelSiteAdapter> _adapters = [
    NovelBinAdapter(),
    // Add other adapters here...
  ];

  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  ));

  final WebViewScrapingService _webViewService = WebViewScrapingService();

  Future<String> scrapePage(String url) async {
    final adapter = _adapters.firstWhere(
      (a) => a.canHandle(url),
      orElse: () => throw Exception("No adapter found for $url"),
    );

    if (adapter.requiresJavaScript) {
      print("Routing to WebViewScrapingService for JS-protected site: ${adapter.siteKey}");
      return await _webViewService.fetchHtml(url);
    } else {
      print("Routing to Dio for standard HTTP site: ${adapter.siteKey}");
      final response = await _dio.get(url);
      return response.data.toString();
    }
  }

  Future<void> runScrape(String url) async {
    try {
      final html = await scrapePage(url);
      final adapter = _adapters.firstWhere((a) => a.canHandle(url));
      
      // Logic for multi-chapter scraping...
      final chapters = await adapter.fetchChapterList(url, html);
      print("Found ${chapters.length} chapters");
      
      for (var chapter in chapters.take(5)) {
        final chapterHtml = await scrapePage(chapter.url);
        final content = await adapter.fetchChapterContent(chapter.url, chapterHtml);
        print("Scraped: ${chapter.title} (${content.length} chars)");
      }
    } catch (e) {
      print("Scrape Failed: $e");
    }
  }
}

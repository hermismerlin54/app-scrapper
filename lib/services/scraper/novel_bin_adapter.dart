import 'package:aura_reader/models/chapter_meta.dart';
import 'package:aura_reader/services/scraper/novel_site_adapter.dart';
import 'package:html/parser.dart' show parse;

class NovelBinAdapter extends NovelSiteAdapter {
  @override
  String get siteKey => 'novelbin';

  @override
  bool get requiresJavaScript => true; // Essential for Cloudflare Bypass

  @override
  bool canHandle(String url) {
    return url.contains('novelbin.com');
  }

  @override
  Future<List<ChapterMeta>> fetchChapterList(String novelUrl, String html) async {
    final document = parse(html);
    final List<ChapterMeta> chapters = [];
    
    // NovelBin specific selectors
    final links = document.querySelectorAll('ul.list-chapter li a');
    for (var i = 0; i < links.length; i++) {
      final a = links[i];
      chapters.add(ChapterMeta(
        index: i,
        title: a.text.trim(),
        url: a.attributes['href'] ?? '',
      ));
    }
    
    return chapters;
  }

  @override
  Future<String> fetchChapterContent(String chapterUrl, String html) async {
    final document = parse(html);
    final contentDiv = document.querySelector('#chr-content') ?? 
                       document.querySelector('.chapter-c');
    
    // Clean up unwanted elements
    contentDiv?.querySelectorAll('div, script, ins, .ads, .adsbygoogle').forEach((el) => el.remove());
    
    return contentDiv?.innerHtml ?? "Content not found.";
  }
}

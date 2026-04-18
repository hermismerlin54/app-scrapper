import 'package:aura_reader/models/chapter_meta.dart';

abstract class NovelSiteAdapter {
  String get siteKey;
  bool get requiresJavaScript;
  
  bool canHandle(String url);
  Future<List<ChapterMeta>> fetchChapterList(String novelUrl, String html);
  Future<String> fetchChapterContent(String chapterUrl, String html);
}

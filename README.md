# リバーシ

ブラウザで遊べるリバーシ（8×8）です。最終的には Capacitor で包んで Android アプリにします。

- CPU と対戦（強さは「よわい」「ふつう」「つよい」の 3 段階、先手・後手を選べる）
- 2 人で対戦
- 打てる場所の表示、直前の手の強調、パスと終局の判定
- 設定（対戦モード・手番・強さ）は端末に保存

> 「オセロ」は株式会社メガハウスの登録商標のため、アプリ名は「リバーシ」としています。

## 技術構成

| 層 | 技術 |
|---|---|
| ゲームロジック | TypeScript（`src/game/`、UI に依存しない純粋な関数） |
| UI | React 19 + Vite |
| CPU | ミニマックス法 + αβ枝刈り。強さは読む深さ（1 / 3 / 5 手）で変える |
| テスト | Vitest |
| Android 化 | Capacitor 8（`android/`） |

## ファイル構成

```
src/
  game/board.ts       盤面・合法手・石の反転・パス／終局の判定
  game/ai.ts          CPU の思考（評価関数と探索）
  game/board.test.ts  ロジックのテスト
  App.tsx             画面
  index.css           見た目（ダークモード対応）
scripts/generate-icons.mjs  アイコン・スプラッシュ画面・favicon の生成
android/              Capacitor が生成した Android プロジェクト
capacitor.config.ts   アプリ ID・アプリ名
```

## 開発

```bash
npm install
npm run dev       # http://127.0.0.1:8630 で開発サーバ
npm test          # ロジックのテスト
npm run build     # 型チェックと本番ビルド（dist/）
npm run preview   # ビルド結果を http://127.0.0.1:8631 で確認
```

ポート 8630・8631 は、この PC のポート台帳（`C:\Users\makot\.claude\ports.json`）に登録済みです。

## Android アプリにする

前提として [Android Studio](https://developer.android.com/studio)（同梱の JDK と Android SDK）が必要です。

```bash
npm run android:sync   # Web をビルドして android/ に反映
npm run android:open   # Android Studio で開く
```

Android Studio で実機かエミュレータを選んで実行します。Web 側を直したら、毎回 `npm run android:sync` をやり直します。

Android Studio を開かずにコマンドでデバッグ用 APK を作ることもできます（PowerShell）。

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew.bat assembleDebug
# できたもの: android\app\build\outputs\apk\debug\app-debug.apk
```

`android\local.properties`（git 管理外）に SDK の場所（`sdk.dir=C:/Users/<ユーザー名>/AppData/Local/Android/Sdk`）が必要です。Android Studio で一度開けば自動で作られます。

### Gradle のバージョンについて

Capacitor が生成した Gradle 8.14.3 は、Android Studio 同梱の Java 25 では動かないため、Gradle 9.5.1 に上げています（`android/gradle/wrapper/gradle-wrapper.properties`）。Gradle 9.6 以降は Android Gradle Plugin 8 系が使えなくなるので、9.6 以上に上げるときは Android Gradle Plugin も 9 系に上げる必要があります。

- アプリ ID：`io.github.makomakoz.reversi`
- アプリ名：リバーシ

## アイコンとスプラッシュ画面

緑の盤に初期配置の石 4 つを並べたデザインです。デザインの正本は `scripts/generate-icons.mjs` の中の SVG で、次のコマンドで全部作り直します。

```bash
npm run icons
```

作られるもの：

- Android のランチャーアイコン（`android/app/src/main/res/mipmap-*/`）
  - `ic_launcher.png`・`ic_launcher_round.png`：アダプティブアイコンに対応しない端末向け
  - `ic_launcher_foreground.png`・`ic_launcher_background.png`：アダプティブアイコンの前景（石）と背景（盤）
- スプラッシュ画面（`android/app/src/main/res/drawable*/splash.png`）
- ブラウザのタブ用アイコン（`public/favicon.svg`）

作り直したら `npm run android:sync` で Android 側に反映します。

## 進捗と課題

残っている作業は GitHub Issue で管理しています。

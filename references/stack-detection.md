# Stack detection

Detect the mobile stack before auditing so you read the right files and apply the right
platform guidelines. Check signals in this order; the first strong match wins. If two match
(e.g. a monorepo), audit each separately.

## React Native / Expo
- `package.json` contains `"react-native"`, or `"expo"`, or `react-native-*` deps.
- Files: `App.tsx`/`App.js`, `*.tsx`/`*.jsx` with `import ... from 'react-native'`.
- Styles: `StyleSheet.create`, inline `style={{...}}`.
- Look in: `src/`, `app/` (Expo Router), `components/`, `screens/`.
- Ignore: `node_modules/`, `ios/Pods/`, `android/build/`, `.expo/`.

## Flutter
- `pubspec.yaml` present with `flutter:` section.
- Files: `lib/**/*.dart`, widgets extending `StatelessWidget`/`StatefulWidget`.
- Look in: `lib/`.
- Ignore: `.dart_tool/`, `build/`, `ios/`, `android/` (native shells).

## Native iOS (SwiftUI / UIKit)
- `*.xcodeproj` / `*.xcworkspace`, `Package.swift`, `Info.plist`.
- SwiftUI: `*.swift` with `: View` and `var body: some View`.
- UIKit: `UIViewController` subclasses, `*.storyboard`, `*.xib`.
- Look in: the app target's `Sources/` or main group.
- Ignore: `Pods/`, `DerivedData/`, `.build/`.

## Native Android (Compose / XML)
- `build.gradle` / `build.gradle.kts`, `AndroidManifest.xml`.
- Compose: `*.kt` with `@Composable`.
- XML views: `res/layout/*.xml`, `res/values/` (colors, dimens, strings).
- Look in: `app/src/main/`.
- Ignore: `build/`, `.gradle/`.

## Kotlin Multiplatform / Compose Multiplatform
- `build.gradle.kts` with `kotlin("multiplatform")` or `org.jetbrains.compose` plugin.
- Structure: `commonMain/`, `androidMain/`, `iosMain/`; often a `composeApp/` or `shared/` module.
- UI: `@Composable` in `commonMain` — audit like Compose, but check **both** platform shells for
  platform fit (§2.10) since one codebase renders on iOS *and* Android.
- Look in: `composeApp/src/commonMain/`, `shared/src/commonMain/`.
- Ignore: `build/`, `.gradle/`, `iosApp/Pods/`.

## .NET MAUI / Xamarin
- `*.csproj` with `<UseMaui>true</UseMaui>` (MAUI) or `Xamarin.Forms` packages (legacy).
- UI: `*.xaml` (+ `*.xaml.cs` code-behind), or C# markup; `App.xaml`, `AppShell.xaml` for shell
  navigation; `MauiProgram.cs`.
- Look in: `Views/`, `Pages/`, `Resources/Styles/`.
- Ignore: `bin/`, `obj/`, `Platforms/*/` generated files.
- Fix idioms: `MinimumHeightRequest/MinimumWidthRequest` (tap targets), `SemanticProperties.Description`
  (a11y), `VisualStateManager` (pressed/disabled states), `Shell` for navigation.

## Ionic / Capacitor / Cordova (webview)
- `capacitor.config.ts`/`.json`, `ionic.config.json`, or `config.xml` (Cordova); web framework
  underneath (Angular/React/Vue).
- UI: web components (`<ion-button>` etc.) or plain HTML/CSS in `src/`.
- Look in: `src/app/` (Angular), `src/pages|components/` (React/Vue).
- Ignore: `www/`, `dist/`, `node_modules/`, `ios/`, `android/` shells.
- **Run the webview-specific checks below** — webview apps fail differently than native.

## PWA / mobile web
- `manifest.json`/`manifest.webmanifest` + service worker; no native shell at all.
- Audit as a webview app (checks below) plus: install prompt UX, offline behavior,
  `viewport` meta, `theme-color`.

## Webview-specific checks (Ionic/Capacitor/Cordova/PWA)
These stacks inherit web defaults that feel wrong on mobile — check for:
- **No native press feedback** — `:active` states / ripple missing on tappables (Ionic components
  have it; custom divs with `onClick` don't). Fix: framework pressable components or explicit
  active styles.
- **300ms tap delay / double-tap zoom** — missing `touch-action: manipulation` or viewport meta.
- **Scroll feel** — momentum scrolling (`-webkit-overflow-scrolling`), rubber-banding, no
  scroll-jank from heavy shadows/filters in long lists; virtualize long lists.
- **Safe areas via CSS** — `env(safe-area-inset-*)` used with `viewport-fit=cover`; content not
  under the notch/home indicator.
- **Text selection & callouts** — UI chrome accidentally selectable (`user-select`), long-press
  callouts on buttons.
- **Keyboard** — webview resize vs overlay mode (`Keyboard` plugin config); focused input not
  covered; no layout jump.
- **A11y** — semantic HTML/ARIA instead of native traits: `aria-label` on icon buttons, real
  `<button>` not clickable `<div>`, focus states visible.
- **Platform fit** — Ionic auto-adapts (`mode="ios"|"md"`); custom components often don't.
  Verify back behavior (Android hardware back must work — Capacitor `App` plugin listener).

## Ambiguous / none
- If nothing matches, ask the user for the stack or a path to UI code.
- If it's a cross-platform monorepo (e.g. RN app + native modules), audit the primary UI layer
  first and note the others.

## Per-stack "how to fix" cheatsheet

| Concern | React Native | Flutter | SwiftUI | Android (Compose) |
|---|---|---|---|---|
| Tap target | `hitSlop`, min `height/width`, padding | `SizedBox`/`ConstrainedBox`, `padding` | `.frame(minWidth:minHeight:)`, `.padding()` | `Modifier.sizeIn(minWidth,minHeight)`, `padding` |
| Press feedback | `Pressable`/`TouchableOpacity` | `InkWell`/`Material` ripple | `Button` styles, `.buttonStyle` | `clickable` + ripple / `Button` |
| A11y label | `accessibilityLabel`, `accessibilityRole` | `Semantics(label:)` | `.accessibilityLabel()` | `contentDescription` / `Modifier.semantics` |
| Safe area | `SafeAreaView`, `useSafeAreaInsets` | `SafeArea` widget | `.safeAreaInset`, safe area by default | `WindowInsets`, `systemBarsPadding` |
| Keyboard | `KeyboardAvoidingView` | `resizeToAvoidBottomInset`, `Scrollable` | `.ignoresSafeArea(.keyboard)` / ScrollView | `imePadding()`, `Modifier.imeNestedScroll` |
| Loading/empty/error | conditional render | `switch`/`AsyncSnapshot` states | `switch` on view state enum | `when` on UI state |
| Contrast/colors | theme constants | `Theme`/`ColorScheme` | `Color` assets, dynamic colors | `MaterialTheme.colorScheme` |

## Per-stack runtime verification hints

For `[likely]` / `[needs-runtime]` findings, tell the developer how to confirm in minutes:

| Check | React Native | Flutter | iOS | Android |
|---|---|---|---|---|
| A11y labels & order | Xcode **Accessibility Inspector** / Android **TalkBack**; RN `Inspector` (`Cmd+D`) | `flutter run` + **Semantics Debugger** (`showSemanticsDebugger: true`) | **Accessibility Inspector** (Xcode → Open Developer Tool) | **TalkBack** or Accessibility Scanner app |
| Tap target size | RN Inspector shows box bounds | Flutter Inspector → "Show guidelines" | Accessibility Inspector audit ("hit region") | **Accessibility Scanner** flags <48dp targets |
| Contrast ratios | any contrast checker on a screenshot (e.g. WebAIM) | same | Accessibility Inspector → Color Contrast audit | Accessibility Scanner → contrast checks |
| Dynamic type / font scale | iOS Settings → Larger Text; Android Font size | `MediaQuery.textScaler` + device font settings | Xcode Environment Overrides → Dynamic Type | Settings → Display size & text |
| Keyboard overlap | run on a small device/simulator, focus each input | same | simulator, toggle software keyboard (`Cmd+K`) | emulator, focus fields with soft keyboard |
| Safe areas / notch | run on a notched simulator (iPhone 15/Pixel 8) | same | same | same, plus gesture-nav mode |
| Reduce motion | iOS Settings → Motion; verify animations respect it | `MediaQuery.disableAnimations` | Environment Overrides → Reduce Motion | Developer options → animation scale off |

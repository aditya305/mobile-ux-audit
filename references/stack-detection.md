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

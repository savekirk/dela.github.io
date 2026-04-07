---
title: "Moving Your Android Data Binding App Out of Beta"
date: 2016-04-28T00:00:00+03:00
description: "A quick fix for migrating an Android app from the beta Data Binding setup to the stable configuration."
categories: [software engineering]
tags: [android, data-binding, gradle]
toc: false
draft: false
---

At Google I/O 2015, the Android Data Binding library was introduced. As described in the [official guide](https://developer.android.com/topic/libraries/data-binding), it gave you the opportunity to write declarative layouts and minimize the glue code needed to bind your application logic and layouts. Many people argued that this would give developers the power to write business logic in XML, which some developers were trying to move away from altogether.

So I jumped on the Data Binding bandwagon and eventually shipped an Android app into production with Data Binding. Really. I swallowed the Data Binding beta pill.

The app had been running smoothly in production with no issue. I recently went back to make some changes, but Android Studio kept complaining that my plugin was too old. So I let Android Studio fix it, and then this happened:

```text
Error: Unable to find method 'android.databinding.tool.LayoutXmlProcessor.<init>(Ljava/lang/String;Landroid/databinding/tool/writer/JavaFileWriter;IZLandroid/databinding/tool/LayoutXmlProcessor$OriginalFileLookup;)V'
```

Turns out the Data Binding Library had moved on, and I was still stuck in beta.

During the beta days of the Data Binding Library, you had to add the following dependencies to your classpath in the top-level `build.gradle` file.

```gradle
dependencies {
  classpath "com.android.tools.build:gradle:{1.3.0-beta4 - 1.4.0-beta6}"
  classpath "com.android.databinding:dataBinder:{1.0-rc[0..4]}"
}
```

The Data Binding plugin then had to be applied to your app module's `build.gradle` file after the application plugin.

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.android.databinding'
```

Turns out the Data Binding Library was no longer in beta, and the only thing you needed to do to start enjoying all the Data Binding goodness was add the `dataBinding` element to your app module's `build.gradle` file.

```gradle
android {
    ...
    dataBinding {
        enabled = true
    }
}
```

### Conclusion

At the time I wrote my app, the Data Binding Library did not support two-way data binding, so I rolled out my own solution. But Android plugin 2.1 alpha 3 now contains official two-way data binding support. Watch out for my sequel on how I replaced my custom two-way data binding solution with the official version.

*Originally published on [Medium](https://medium.com/@savekirk/moving-your-android-data-binding-app-out-of-beta-8b1c684e3f68) on April 28, 2016.*

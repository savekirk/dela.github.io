---
title: "Generating Timeline Hover Previews with Android Media3"
date: 2026-03-01T00:00:00+03:00
description: "Generate on-device storyboard sprites and WebVTT metadata for timeline hover previews using Android Media3 Inspector APIs."
categories: [software engineering]
tags: [android, media3, video, exoplayer]
toc: false
draft: false
---

![Timeline hover preview demo during scrubbing](/images/timeline-hover-previews/preview-demo.png)

Timeline hover previews also called **trick play**, **scrub bar previews**, or **seek bar previews** show an image popup as the user scrubs through a video, similar to YouTube.

To support this, you need:

- preview images extracted from the video,
- the time positions those images represent,
- metadata so the player can map a seek time to the correct preview tile.

A common approach is to generate a **storyboard** (sprite sheet): a single image containing many thumbnails laid out in a grid. This is often done server-side, but you can also generate it on-device. In this article, we focus on how to do that using Android Media3 Inspector APIs.

## Creating the storyboard

We will use the [Media3 Inspector](https://developer.android.com/media/media3/inspector) module to inspect media and extract frames from a local or remote `MediaItem`.
You can find the complete implementation in [StoryBoardGenerator.kt](https://github.com/savekirk/android-media-lab/blob/main/src/StoryBoardGenerator.kt).

### Retrieve video duration

Before extracting frames, get the video duration.

We use [MetadataRetriever](https://developer.android.com/reference/androidx/media3/inspector/MetadataRetriever) to read duration in microseconds, then convert it to milliseconds.

```kotlin
private suspend fun retrieveDurationMs(): Long {
    try {
        MetadataRetriever.Builder(context, config.mediaItem).build().use { retriever ->
            val durationUs = retriever.retrieveDurationUs().await()
            if (durationUs == C.TIME_UNSET || durationUs <= 0L) {
                return 0L
            }
            return durationUs / 1_000L
        }
    } catch (e: Exception) {
        return 0L
    }
}
```

Read more: [Retrieve metadata with Media3 Inspector](https://developer.android.com/media/media3/inspector/retrieve-metadata).

### Grid layout

The storyboard is a grid. Given the total number of thumbnails, choose rows and columns so:

- all thumbnails fit exactly,
- there are no empty cells,
- the grid is as balanced (square-like) as possible.

If the thumbnail count is a perfect square, for example `9`, the grid is `3 x 3`. Otherwise, find the divisor closest to `sqrt(totalThumbnail)` and derive rows from it.

```kotlin
private fun getTile(totalThumbnail: Int): Pair<Int, Int> {
    val factor = sqrt(totalThumbnail.toDouble()).toInt()
    // If factor is an integer, it's a perfect square
    if (factor * factor == totalThumbnail) {
        return Pair(factor, factor)
    }

    val divisors = mutableListOf<Int>()
    for (currentDiv in 1..totalThumbnail) {
        if (totalThumbnail % currentDiv == 0) {
            divisors.add(currentDiv)
        }
    }

    val target = sqrt(totalThumbnail.toDouble())
    var bestCol = 1
    var minDiff = Double.MAX_VALUE

    for (div in divisors) {
        // The product of div and (totalThumbnail / div) is always totalThumbnail
        val currentDiff = kotlin.math.abs(div - target)
        if (currentDiff < minDiff) {
            minDiff = currentDiff
            bestCol = div
        }
    }
    val bestRow = totalThumbnail / bestCol

    return Pair(bestCol, bestRow)
}
```

### Fill the grid

Create a bitmap large enough to hold every tile, then extract frames at target positions and draw each frame at its grid location.

[FrameExtractor](https://developer.android.com/reference/androidx/media3/inspector/frame/FrameExtractor) handles frame extraction. We also apply a resize effect so every tile has consistent dimensions.

```kotlin
private suspend fun extractFrames(positions: List<Long>) {
    val resizeEffect = Presentation.createForWidthAndHeight(
        config.imageWidth,
        config.imageHeight,
        LAYOUT_SCALE_TO_FIT
    )
    FrameExtractor.Builder(context, config.mediaItem)
        .setEffects(listOf(resizeEffect))
        .build().use { extractor ->
            positions.forEachIndexed { index, requestedPositionMs ->
                try {
                    val frame = extractor.getFrame(requestedPositionMs).await()
                    drawFrame(index, frame.bitmap)
                    frame.bitmap.recycle()
                } catch (_: Exception) {
                    // Keep un-extracted tiles black.
                }
            }
        }
}
```

At this point, you have the storyboard image (`.jpg`) in cache.

### Storyboard metadata (WebVTT)

A sprite image alone is not enough. The player also needs:

- cue time range (`start --> end`),
- tile coordinates (`x,y,width,height`) inside the sprite.

WebVTT is a common format for timeline previews. Each cue points to the sprite file using `#xywh=`.

```kotlin
private fun buildWebVttMetadata(
    imageFileName: String,
    tiles: List<StoryBoardTileMetadata>,
): String {
    val builder = StringBuilder()
    builder.append("WEBVTT\n\n")

    tiles.forEach { tileMetadata ->
        builder
            .append(formatAsWebVttTime(tileMetadata.startTimeMs))
            .append(" --> ")
            .append(formatAsWebVttTime(tileMetadata.endTimeMs))
            .append('\n')
            .append(imageFileName)
            .append("#xywh=")
            .append(tileMetadata.x)
            .append(',')
            .append(tileMetadata.y)
            .append(',')
            .append(tileMetadata.width)
            .append(',')
            .append(tileMetadata.height)
            .append("\n\n")
    }

    return builder.toString().trimEnd() + "\n"
}
```

This produces a `.vtt` file where each cue maps a time interval to a tile in the sprite.

## Using the generated outputs

The generator returns:

- sprite image file (`.jpg`),
- WebVTT metadata file (`.vtt`),
- frame positions and grid details.

Your player integration can then load the VTT and sprite to render hover previews during scrubbing.

## Wrap-up

Using Media3 Inspector, you can build timeline previews fully on-device by:

1. reading media duration with `MetadataRetriever`,
2. extracting resized frames with `FrameExtractor`,
3. composing a storyboard sprite and WebVTT timeline metadata.

That gives you the core building blocks needed for timeline hover previews without requiring server-side storyboard generation.

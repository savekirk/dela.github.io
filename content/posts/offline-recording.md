---
title: "Offline Recording at PingPong"
date: 2021-09-22T00:00:00+00:00
description: "How we built offline recording at PingPong to ensure users never lose their recordings, even without internet connectivity."
categories: [software engineering]
tags: [video, audio, offline, architecture]
toc: false
draft: false
---

At PingPong, our goal is to help distributed teams get their best work done.

We're building a product that lets you work when you want to get work done while making you incredibly fast and efficient.

We aim to build the fastest and most reliable way to send asynchronous videos, audio messages, and screen recordings. We want our recordings to arrive the minute our users stop recording and never fail or lose data, even with serious connection issues.

To do this, we've made several significant improvements to our recording process:

- Offline sending
- Media server improvements
- Add more telemetry data

We enabled offline sending without compromising our goal of fast and reliable sending. We save your recordings locally and stream them to our media server concurrently.

Here's a sketch of how this works.

![Offline sending flow](/images/offline-recording/offline-sending-flow.png)

### Redesigning our recording pipeline

We set out to achieve the following goals with offline recording:

- Record messages when offline
- Ongoing recordings should not be affected by network interruptions
- Make final recording playable locally
- Allow the user to retry or delete messages that failed to upload
- Monitor recording for failure or issue

With the above goals, we had to reimagine how we do recordings in our client applications.

Our recorder needs to output a single format that is playable offline and output chunks of data for upload.

### Processing chunks

Every chunk of data received from the recorder is processed and then uploaded.

Below is a rough sketch of how we process the recording chunks.

![Chunk processing flow](/images/offline-recording/chunk-processing-flow.png)

When a user's connectivity drops during upload, we retry a couple of times until we succeed or fail. When our automatic retry threshold is exhausted, we cede control to the user and queue the rest of the chunks.

For failed uploads, the user has the option to retry or delete them.

## Recording reliability

By adding offline recording capability, we fixed the issue of users losing their recordings.

With enough telemetry data, we're able to monitor, quality control, and improve our recording pipeline.

With all these changes, we're very close to achieving our 99.99% sending SLO.

## What's next

- We will automatically retry failed uploads when the user regains internet connectivity within a set number of hours.
- The user will have the flexibility to decide if they want to record offline only. Also, control when it is uploaded.
- We will provide the ability to edit your locally recorded messages.

*Originally published on the [PingPong blog](https://web.archive.org/web/20210923031416/https://blog.getpingpong.com/offline/) on September 22, 2021.*

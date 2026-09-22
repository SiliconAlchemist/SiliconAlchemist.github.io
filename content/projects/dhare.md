---
title: "DHARE: Response Emotions for Hateful-Meme Detection"
collection: data
secondaryCollection: dev
order: 5
draft: false
summary: A multimodal dataset and classification study combining memes, text, and physiological response signals to investigate hateful-content detection.
category: AFFECTIVE COMPUTING · RESEARCH
tags:
  - Multimodal learning
  - GSR & PPG
  - Hateful-content detection
art: chart
cover:
  src: /projects/dhare/cover.jpg
  alt: A participant wearing a Shimmer3 sensor with electrodes attached to the wrist and fingers.
  fit: cover
  position: 50% 48%
links:
  - label: Read the project paper
    url: https://drive.google.com/file/d/1TfYuqgeGA9cfKHNSrz2gyf3683Ksx93T/view?usp=sharing
note: Equal-contribution research project with Aditya Rastogi and Arka Sarkar at IIIT Delhi.
---

## Overview

Hateful-content detection usually focuses on what a post contains: its text, imagery, or both. DHARE investigates another source of context—how people physiologically respond when they encounter that content.

The project extends the Memotion dataset with human response signals, creating a multimodal research dataset that connects hateful memes with their offensive-intensity labels and the emotions they induced in participants.

## Study and dataset

We collected data from **44 participants aged 18–24**, including 18 women and 26 men. After informed consent and a warning that the study contained potentially offensive material, each participant viewed a randomized, class-balanced set of 50 memes while wearing a Shimmer3 GSR+ device.

The device recorded two non-intrusive physiological signals:

- **Galvanic skin response (GSR),** capturing changes in electrodermal activity.
- **Photoplethysmography (PPG),** supporting heart-rate and heart-rate-variability features.

The resulting DHARE dataset contains **1,791 labelled memes** spanning four offensive-content classes, with class balancing applied during construction. Its physiological features include heart-rate, interbeat-interval, breathing-rate, peak, recovery, amplitude, and related signal measures. The study deliberately avoided collecting identifying images, video, or audio from participants.

## Multimodal approach

We compared three baseline configurations—image only, image with text, and text with lexicon-derived emotions—with a multimodal model combining image, text, and physiological features.

The final pipeline used ResNet50 image features, BERT text embeddings, and preprocessed GSR and PPG features. These were concatenated into a 1,790-dimensional feature vector and passed to an AutoML framework using an 80:20 train-test split.

## Results

The image-text-physiology model achieved **46% classification accuracy**, compared with 45% for the image-only baseline, 39% for text with lexicon-derived emotions, and 37% for image with text. Within this experiment, the multimodal result offered initial evidence that physiological response signals can add useful context to hateful-meme classification.

The study also has an important limitation: each meme was paired with physiological data from only one participant. Collecting responses from multiple participants for the same meme was identified as a direction for future work.

## Collaboration

DHARE was developed with **Aditya Rastogi and Arka Sarkar** at IIIT Delhi. The paper states that all three authors contributed equally to the research.

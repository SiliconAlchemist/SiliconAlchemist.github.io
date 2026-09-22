---
title: Stable Learned Bloom Filters
collection: data
secondaryCollection: dev
order: 4
draft: false
summary: Choosing classifiers for approximate membership in streaming data.
category: LEARNED DATA STRUCTURES · MACHINE LEARNING
tags:
  - Python
  - Bloom filters
  - Machine learning
art: scatter
cover:
  src: /projects/stable-learned-bloom-filters/cover.png
  alt: A diagram showing learned classifiers setting bits in a Bloom filter
  fit: contain
  position: 50% 50%
links:
  - label: View project report
    url: https://drive.google.com/file/d/1HcpcfAngoh7a0mva8I7nIiQwZon9cPEt/view?usp=drive_link
  - label: View source code
    url: https://github.com/SiliconAlchemist/Learned_Stable_Bloom_Filters
---

## Overview

Co-authored with Aditya Rastogi, this project studied how classifier choice affects Stable Learned Bloom Filters for streaming data. It compared Gaussian Naive Bayes, logistic regression, and support vector machines across two tasks: malicious URL classification and approximate membership queries for URL caching.

## Foundation and credit

The work builds on the Stable Learned Bloom Filter architecture proposed by Qiyu Liu, Libin Zheng, Yanyan Shen, and Lei Chen in “Stable learned bloom filters for data streams.” It also draws on the Stable Bloom Filter work of Fan Deng and Davood Rafiei, as cited in the project report.

## Approach

The implementation combined a learned classifier with a stable Bloom Filter that ages information out as a stream grows. The classifier made the first prediction, while the Bloom Filter served as a backup to bound errors.

The team wrote the analysis, Bloom Filter, and data preprocessing code in Python. It compared classifiers by false positive and false negative rates over streaming insertion workloads, using 30,000 labelled URLs for malicious URL classification and a synthetic URL-caching dataset of about 50,000 entries.

## Findings

For malicious URL classification, logistic regression and Gaussian Naive Bayes achieved lower error rates than the support vector machine. For URL caching, logistic regression and the support vector machine performed better than Gaussian Naive Bayes. Across both tasks, logistic regression gave the strongest overall performance in this evaluation.

The study used default model settings and custom insertion workloads for the classification task, so its results are initial guidance rather than a general classifier benchmark.

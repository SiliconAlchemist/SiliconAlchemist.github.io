---
title: Solid Texture Generation
collection: dev
order: 3
draft: false
summary: Synthesizing reusable 3D textures from 2D exemplar images.
category: COMPUTER GRAPHICS
tags:
  - C++
  - 3D texture synthesis
  - Computer graphics
art: app
cover:
  src: /projects/solid-textures/cover.png
  alt: A wood-like solid texture applied to a sculptural 3D form, with its 2D exemplar inset
  fit: contain
  position: 50% 50%
links:
  - label: View project report
    url: https://drive.google.com/file/d/10Q98zo1FZKtDORgeoxns7mEX96yvayHU/view?usp=sharing
  - label: View repository
    url: https://github.com/SiliconAlchemist/Solid_Texture_Generation
  - label: Read the original paper
    url: https://dl.acm.org/doi/epdf/10.1145/1276377.1276380
---

## Overview

This Computer Graphics course project at IIIT Delhi implements a method for synthesizing solid 3D textures from 2D exemplar images. A solid texture carries information through an object's volume, so the material can extend into interior regions instead of being mapped only onto its surface.

## Foundation and credit

This was an implementation and exploration building on [“Solid texture synthesis from 2D exemplars” by Johannes Kopf and collaborators](https://dl.acm.org/doi/epdf/10.1145/1276377.1276380). The original paper introduced the method; this project implemented and evaluated it in C++.

## Approach

Starting from randomly sampled texels in a 2D exemplar, the implementation generated a 3D texture volume and applied it to a 3D model. It combined three stages:

- local texture optimization using an energy function over voxel neighborhoods
- a search for the closest matching neighborhoods in the exemplar
- histogram matching to better preserve the exemplar's global color statistics

## Outcome

The implementation produced 3D textures from 2D inputs and applied them to 3D models. The report identifies low texture resolution and a fixed number of optimization iterations as the main limits on visual quality, chosen to keep runtime manageable.

---
title: "Fable: A Sketch-Based Animation Platform"
collection: design
secondaryCollection: dev
order: 2
draft: false
summary: A modular 2D animation prototype that combines freehand drawing, manual character rigging, inverse kinematics, and keyframe-based posing.
category: COMPUTER GRAPHICS · INTERACTION DESIGN
tags:
  - C++
  - Qt
  - Inverse kinematics
  - 2D animation
art: app
cover:
  src: /projects/fable/fable_sba.png
  alt: Fable logo beside its skeleton-definition interface, showing a hand-rigged character.
  fit: cover
  position: 50% 50%
links:
  - label: View presentation
    url: https://drive.google.com/file/d/1cyDOm5EgV8fnnYlu1MLayt7O809_kNsT/view?usp=sharing
note: B.Tech Project at IIIT Delhi with Aditya Singh Rathore, advised by Dr Ojaswa Sharma.
---

## Overview

Fable explores how a digital animation tool can reduce the repetitive work of frame-by-frame animation without taking away an artist's ability to draw and pose characters directly. Developed as a B.Tech research project at IIIT Delhi, the prototype brings sketching, character selection, manual rigging, and skeletal animation into one workflow intended to be approachable for both new and experienced animators.

## System design

The platform separates a reusable, header-only C++ library from a cross-platform Qt Widgets interface. Its scene model organizes a canvas into scenes, characters, strokes, and points, while the interface groups work into three modes: scribbling, selection, and animation.

This structure lets an animator draw characters, select and transform their parts, define a skeleton, and build an animation without switching between disconnected tools. A timeline and action-unit workflow organize poses and reusable movements.

## My contribution

My work focused on the interaction between the artist and the skeletal-animation system:

- Formalized the manual skeletonization workflow and implemented rendering, editing, and deletion of joints.
- Designed and built the interface for rigging and skinning hand-drawn characters.
- Created a skeleton representation suited to Fable and implemented the FABRIK inverse-kinematics algorithm for posing it.
- Explored alternative animation workflows and ways to represent action units, then built the interface that supports them.

## From sketch to movement

An animator begins by drawing or selecting a character, constructs a skeleton over the artwork, and binds the drawing to that rig. Moving an end effector drives the joint chain through FABRIK, making it possible to pose the character through direct manipulation. Poses can then be captured as keyframes; interpolation and skinning turn those poses into skeletal animation.

The result was a working skeletal-animation prototype and a foundation for a broader sketch-based animation system. The project report identifies tighter integration between motion paths and skeletal animation, improved performance and drawing tools, and automatic skeleton generation as future directions.

## Collaboration

Fable was created with Aditya Singh Rathore under the guidance of Dr Ojaswa Sharma. Aditya's documented contributions included linear blend skinning and the skeletal-animation backend for timing, keyframes, and interpolation; my work covered manual skeletonization, inverse kinematics, and the animation workflow described above.

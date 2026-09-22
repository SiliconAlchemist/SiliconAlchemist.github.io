---
title: Curiosity Driven Reinforcement Learning
collection: data
order: 3
draft: false
summary: Exploring sparse-reward environments with an Intrinsic Curiosity Module and A3C, evaluated in Pong and MiniWorld Four Rooms.
category: REINFORCEMENT LEARNING
tags:
  - Python
  - PyTorch
  - A3C
  - Intrinsic curiosity
art: code
cover:
  src: /projects/learning-to-explore/cover.png
  alt: Illustrative Super Mario Bros. artwork with Mario, clouds, and brick platforms; not a screenshot of the evaluated environments.
  fit: contain
  position: 50% 50%
links:
  - label: View presentation
    url: https://drive.google.com/file/d/1WiELQbD7s5x8bUBLOwZxLLxnExUnAXcr/view?usp=sharing
  - label: View source code
    url: https://bit.ly/2Y5Yip0
note: Joint project with Nishant Grover, building on Pathak et al. (2017). Cover artwork is illustrative; experiments used Pong and MiniWorld.
---

## About the work

How can an agent learn to explore when useful external rewards are scarce? In this joint project with Nishant Grover, we investigated curiosity as an intrinsic reward signal, building on *Curiosity-driven Exploration by Self-supervised Prediction* by Pathak, Agrawal, Efros, and Darrell (2017).

Our goal was to implement the approach and explore its behavior in different environments, without relying on extensive domain-specific reward design.

## Approach

We compared Asynchronous Advantage Actor-Critic (A3C) with A3C augmented by an Intrinsic Curiosity Module (ICM). The curiosity module adds an intrinsic learning signal based on self-supervised prediction, encouraging exploration beyond the environment's external rewards.

The presentation documents two evaluation environments:

- **Atari Pong:** rewards arrive when a player misses the ball, leaving stretches of interaction without that feedback.
- **MiniWorld Four Rooms:** a navigation task with very sparse rewards. The presentation describes it as analogous to VizDoom; it does not identify VizDoom as an evaluated environment.

## What we observed

The reported learning curves use a running average over the previous 100 games. In Pong, the A3C+ICM curve rises earlier and reaches positive average rewards, while the vanilla A3C curve remains negative over the displayed run.

In MiniWorld, the A3C baseline shows limited progress, whereas the curiosity-augmented agent develops a stronger upward reward trend and reaches higher rewards in the plotted experiments.

These results illustrate how an intrinsic exploration signal can help in the tested sparse-reward settings. The slides do not report repeated-seed statistics or uncertainty estimates, so the plots should be read as the project's observed runs rather than a general performance guarantee.

## Collaboration and foundations

The presentation credits Nishant Grover and Shrikant Garg as project collaborators. It builds on Pathak et al.'s curiosity-driven exploration work and the A3C research of Mnih et al. (2016), and acknowledges implementation resources in its references. The individual division of implementation and experimentation work is not specified in the presentation.

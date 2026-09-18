# ⚡ GridWise — LLM Energy Optimizer

## Overview

GridWise is an LLM-assisted smart energy optimization system designed to generate a 24-hour energy schedule from natural-language operator instructions.

The system manages:

- Solar energy
- Battery storage
- Grid electricity
- Energy cost
- Operator constraints

## Problem

Energy operators may need to manage complex energy resources while responding to changing conditions and operational instructions.

GridWise converts natural-language instructions into structured directives and applies them to an energy optimization process.

## How It Works

Operator Notes
↓
LLM / Directive Interpreter
↓
Guardrails
↓
Energy Optimizer
↓
24-Hour Energy Schedule
↓
Grid + Solar + Battery Plan

## Main Features

- Natural-language operator instructions
- AI-assisted directive interpretation
- Safety/validation guardrails
- Solar utilization
- Battery management
- Grid electricity management
- 24-hour scheduling
- Cost calculation
- Peak grid usage calculation
- Web dashboard

## Technologies

- HTML
- CSS
- JavaScript
- Node.js
- Express
- OpenAI API

## API Endpoints

### GET /health

Checks whether the server is running.

### POST /optimize-energy

Receives an energy scenario and returns an optimized 24-hour energy plan.

## Run Locally

Install dependencies:

```bash
npm install
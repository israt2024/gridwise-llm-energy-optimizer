# GridWise LLM Energy Optimizer

GridWise is an LLM-assisted energy optimization system that converts natural-language operator notes into structured energy directives and generates a 24-hour energy schedule.

## Features

- Natural-language operator note interpretation
- Solar reduction directives
- Battery reserve constraints
- Battery charge/discharge constraints
- Grid usage constraints
- Guardrail validation
- 24-hour energy scheduling
- REST API
- Web-based interface

## System Flow

Operator Notes
↓
LLM / Directive Interpreter
↓
Guardrails
↓
Energy Optimizer
↓
24-Hour Energy Plan

## API

### Health Check

GET `/health`

### Optimize Energy

POST `/optimize-energy`

## Run Locally

Install dependencies:

```bash
npm install
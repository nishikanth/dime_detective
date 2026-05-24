# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application using TypeScript, React 19, and Tailwind CSS v4. The project uses Turbopack for faster builds and includes ESLint for code quality.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production app with Turbopack  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture

### App Router Structure
- Uses Next.js App Router with `src/app/` directory
- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/page.tsx` - Home page component
- `src/app/globals.css` - Global styles with Tailwind CSS v4

### Styling System
- Tailwind CSS v4 with inline theme configuration
- CSS custom properties for theming (dark/light mode)
- Geist Sans and Geist Mono fonts from Google Fonts

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to `./src/*`
- Next.js plugin for enhanced TypeScript support

## Key Features

- Turbopack integration for faster development and builds
- Automatic dark mode support via CSS media queries
- Font optimization with `next/font`
- Modern ESLint configuration with Next.js rules
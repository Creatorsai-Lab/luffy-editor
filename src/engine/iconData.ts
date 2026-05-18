import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentType, SVGProps } from 'react'
import {
  // Arrows
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, ArrowBigRight, ArrowBigLeft, ArrowBigUp, ArrowBigDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown,
  CornerDownRight, CornerRightDown, MoveRight, MoveLeft, MoveUp, MoveDown,
  RotateCcw, RefreshCw, Repeat,
  // Flow
  GitBranch, GitFork, GitMerge, Workflow, Shuffle, Network, Share2, Split,
  // Code & Tech
  Code2, Terminal, Monitor, Server, Database, Cloud, Globe, Wifi, Cpu, HardDrive,
  BrainCircuit, Binary, Hash, Braces, FileCode, Package, Boxes,
  Lock, Unlock, Shield, Key, Container,
  // Math & Data
  Plus, Minus, X, Divide, Equal, Sigma, Percent, Pi, Infinity,
  BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Activity, Variable,
  // Education
  BookOpen, Book, GraduationCap, Lightbulb, Brain, Microscope, FlaskConical, Atom,
  Calculator, Pencil, Ruler, Library, Zap, Star, Target, Bookmark, FileText,
  // Objects & People
  User, Users, Bot, Building, Bell, Clock, Timer, Compass, Map, Flag,
  // Interface & Actions
  Search, Filter, Settings, Layers, Eye, EyeOff, Check, CheckCircle, XCircle,
  AlertCircle, Info, HelpCircle, Columns, Rows, Grid3x3, List, ToggleLeft, Tag,
} from 'lucide-react'

export type LucideIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; color?: string }>

export const ICON_MAP: Record<string, LucideIconComponent> = {
  // Arrows
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, ArrowBigRight, ArrowBigLeft, ArrowBigUp, ArrowBigDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown,
  CornerDownRight, CornerRightDown, MoveRight, MoveLeft, MoveUp, MoveDown,
  RotateCcw, RefreshCw, Repeat,
  // Flow
  GitBranch, GitFork, GitMerge, Workflow, Shuffle, Network, Share2, Split,
  // Code & Tech
  Code2, Terminal, Monitor, Server, Database, Cloud, Globe, Wifi, Cpu, HardDrive,
  BrainCircuit, Binary, Hash, Braces, FileCode, Package, Boxes,
  Lock, Unlock, Shield, Key, Container,
  // Math & Data
  Plus, Minus, X, Divide, Equal, Sigma, Percent, Pi, Infinity,
  BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown, Activity, Variable,
  // Education
  BookOpen, Book, GraduationCap, Lightbulb, Brain, Microscope, FlaskConical, Atom,
  Calculator, Pencil, Ruler, Library, Zap, Star, Target, Bookmark, FileText,
  // Objects & People
  User, Users, Bot, Building, Bell, Clock, Timer, Compass, Map, Flag,
  // Interface & Actions
  Search, Filter, Settings, Layers, Eye, EyeOff, Check, CheckCircle, XCircle,
  AlertCircle, Info, HelpCircle, Columns, Rows, Grid3x3, List, ToggleLeft, Tag,
} as Record<string, LucideIconComponent>

export const ICON_CATEGORIES: Record<string, string[]> = {
  'Arrows': [
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRightLeft',
    'ArrowUpRight', 'ArrowDownRight', 'ArrowBigRight', 'ArrowBigLeft', 'ArrowBigUp', 'ArrowBigDown',
    'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'ChevronsRight', 'ChevronsLeft', 'ChevronsUp', 'ChevronsDown',
    'CornerDownRight', 'CornerRightDown', 'MoveRight', 'MoveLeft', 'MoveUp', 'MoveDown',
    'RotateCcw', 'RefreshCw', 'Repeat',
  ],
  'Flow': [
    'GitBranch', 'GitFork', 'GitMerge', 'Workflow', 'Shuffle', 'Network', 'Share2', 'Split',
  ],
  'Code & Tech': [
    'Code2', 'Terminal', 'Monitor', 'Server', 'Database', 'Cloud', 'Globe', 'Wifi', 'Cpu',
    'HardDrive', 'BrainCircuit', 'Binary', 'Hash', 'Braces', 'FileCode', 'Package', 'Boxes',
    'Lock', 'Unlock', 'Shield', 'Key', 'Container',
  ],
  'Math & Data': [
    'Plus', 'Minus', 'X', 'Divide', 'Equal', 'Sigma', 'Percent', 'Pi', 'Infinity',
    'BarChart2', 'BarChart3', 'LineChart', 'PieChart', 'TrendingUp', 'TrendingDown',
    'Activity', 'Variable',
  ],
  'Education': [
    'BookOpen', 'Book', 'GraduationCap', 'Lightbulb', 'Brain', 'Microscope', 'FlaskConical',
    'Atom', 'Calculator', 'Pencil', 'Ruler', 'Library', 'Zap', 'Star', 'Target',
    'Bookmark', 'FileText',
  ],
  'People & Objects': [
    'User', 'Users', 'Bot', 'Building', 'Bell', 'Clock', 'Timer', 'Compass', 'Map', 'Flag',
  ],
  'Interface': [
    'Search', 'Filter', 'Settings', 'Layers', 'Eye', 'EyeOff', 'Check', 'CheckCircle',
    'XCircle', 'AlertCircle', 'Info', 'HelpCircle', 'Columns', 'Rows', 'Grid3x3',
    'List', 'ToggleLeft', 'Tag',
  ],
}

export const ALL_CATEGORY = 'All'

/** Build SVG string for a given icon. Used by Konva canvas renderer. */
export function buildIconSvg(iconName: string, color: string, strokeWidth: number, size = 24): string {
  const Comp = ICON_MAP[iconName]
  if (!Comp) return ''
  // Escape color for safe XML injection
  const safeColor = color.replace(/"/g, '&quot;')
  // Use renderToStaticMarkup from react-dom/server (synchronous, safe in browser via Vite)
  try {
    return renderToStaticMarkup(
      createElement(Comp as any, { color: safeColor, size, strokeWidth, fill: 'none' })
    )
  } catch {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${safeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`
  }
}

/** Convert SVG string to a data URL. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

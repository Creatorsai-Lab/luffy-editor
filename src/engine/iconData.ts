import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentType, SVGProps } from 'react'
import {
  // Arrows & Movement
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, ArrowUpLeft, ArrowDownLeft,
  ArrowBigRight, ArrowBigLeft, ArrowBigUp, ArrowBigDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown,
  CornerDownRight, CornerRightDown, CornerUpLeft, CornerUpRight,
  MoveRight, MoveLeft, MoveUp, MoveDown, Move,
  RotateCcw, RotateCw, RefreshCw, RefreshCcw, Repeat, Repeat2,
  // API & Integrations
  Webhook, Cable, Plug, Plug2, PlugZap, Unplug, Route,
  RadioTower, Antenna, Link2, Parentheses, Regex, SquareCode,
  // AI & Machine Learning
  CircuitBoard, GitGraph, Spline, TreeDeciduous, TreePine,
  Scan, ScanLine, ScanEye, Blocks, BotMessageSquare,
  // Flow & Logic
  GitBranch, GitFork, GitMerge, GitCommit, GitPullRequest,
  Workflow, Shuffle, Network, Share2, Split, Waypoints,
  // Code & Tech
  Code2, Terminal, Monitor, Server, Database, Cloud, Globe, Wifi, Cpu, HardDrive,
  BrainCircuit, Binary, Hash, Braces, FileCode, Package, Boxes,
  Lock, Unlock, Shield, Key, Container, Bug, Link, ExternalLink,
  Layers, Layers2, Laptop, Smartphone, Tablet, Watch,
  // Math & Data
  Plus, Minus, X, Divide, Equal, Sigma, Percent, Pi, Infinity,
  BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, Variable, FunctionSquare, Superscript, Subscript,
  // Education & Science
  BookOpen, Book, GraduationCap, Lightbulb, Brain, Microscope, FlaskConical, Atom,
  Calculator, Pencil, Ruler, Library, Zap, Star, Target, Bookmark, FileText,
  TestTube, TestTube2, Dna, Fingerprint, Telescope, Orbit,
  // Communication
  MessageSquare, MessageCircle, Mail, Phone, PhoneCall, Send,
  BellOff, AtSign, Inbox, MessageSquarePlus, Voicemail,
  // Files & Storage
  File, Folder, FolderOpen, FileCheck, FileX, FilePlus, FileMinus,
  Save, Download, Upload, Copy, Clipboard, ClipboardCheck, ClipboardList,
  FolderPlus, FolderX, HardDriveDownload, HardDriveUpload,
  // Time & Calendar
  Calendar, CalendarCheck, CalendarX, AlarmClock, Hourglass, Clock,
  // Media & Audio
  Camera, CameraOff, Video, VideoOff, Mic, MicOff, Headphones,
  Volume2, VolumeX, Volume1, Tv, Radio, Music, Podcast,
  Play, Pause, SkipForward, SkipBack, FastForward, Rewind,
  // Status & Alerts
  Check, CheckCircle, CheckCheck, XCircle, AlertCircle, AlertTriangle,
  AlertOctagon, Info, HelpCircle, Ban, CircleOff, ShieldCheck, ShieldX,
  // Nature & Weather
  Sun, Moon, Flame, Leaf, Mountain, Droplets, Snowflake, Wind,
  Waves, CloudRain, CloudLightning, Cloudy, Sunset, Sunrise, Rainbow,
  // Transport
  Car, Plane, Train, Rocket, MapPin, Bike, Navigation, Navigation2,
  Anchor, Compass, Truck, Bus, Ship,
  // Health & Medical
  Heart, HeartCrack, Pill, Stethoscope, Syringe, Bandage, Activity as ActivityAlt,
  // Commerce & Finance
  DollarSign, CreditCard, ShoppingCart, ShoppingBag, Wallet,
  Receipt, Tag, Package as PackageAlt, Store, Percent as PercentAlt,
  // People & Social
  User, Users, UserPlus, UserMinus, UserCheck, Bot, Building, Building2,
  Bell, Timer, Flag, FlagTriangleRight,
  // Interface & Layout
  Search, Filter, Settings, Settings2, Eye, EyeOff,
  Columns, Rows, Grid3x3, Grid2x2, List, ListOrdered,
  ToggleLeft, ToggleRight, SlidersHorizontal, Sliders,
  Home, Menu, MoreHorizontal, MoreVertical, Maximize, Minimize,
  PanelLeft, PanelRight, PanelTop, PanelBottom,
  // Editing & Tools
  Scissors, Crop, Eraser, PenTool, Pen, Highlighter,
  Wand, Wand2, Brush, Palette, Pipette,
  // Miscellaneous
  Sparkles, Trophy, Award, Gift, Lightbulb as LightbulbAlt,
  Puzzle, Dice1, Gem, Crown, Swords, Shield as ShieldAlt,
  Map, Globe2, LocateFixed, Crosshair, Focus,
} from 'lucide-react'

export type LucideIconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number; color?: string }>

export const ICON_MAP: Record<string, LucideIconComponent> = {
  // Arrows & Movement
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, ArrowUpLeft, ArrowDownLeft,
  ArrowBigRight, ArrowBigLeft, ArrowBigUp, ArrowBigDown,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ChevronsRight, ChevronsLeft, ChevronsUp, ChevronsDown,
  CornerDownRight, CornerRightDown, CornerUpLeft, CornerUpRight,
  MoveRight, MoveLeft, MoveUp, MoveDown, Move,
  RotateCcw, RotateCw, RefreshCw, RefreshCcw, Repeat, Repeat2,
  // API & Integrations
  Webhook, Cable, Plug, Plug2, PlugZap, Unplug, Route,
  RadioTower, Antenna, Link2, Parentheses, Regex, SquareCode,
  // AI & Machine Learning
  CircuitBoard, GitGraph, Spline, TreeDeciduous, TreePine,
  Scan, ScanLine, ScanEye, Blocks, BotMessageSquare,
  // Flow & Logic
  GitBranch, GitFork, GitMerge, GitCommit, GitPullRequest,
  Workflow, Shuffle, Network, Share2, Split, Waypoints,
  // Code & Tech
  Code2, Terminal, Monitor, Server, Database, Cloud, Globe, Wifi, Cpu, HardDrive,
  BrainCircuit, Binary, Hash, Braces, FileCode, Package, Boxes,
  Lock, Unlock, Shield, Key, Container, Bug, Link, ExternalLink,
  Layers, Layers2, Laptop, Smartphone, Tablet, Watch,
  // Math & Data
  Plus, Minus, X, Divide, Equal, Sigma, Percent, Pi, Infinity,
  BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, Variable, FunctionSquare, Superscript, Subscript,
  // Education & Science
  BookOpen, Book, GraduationCap, Lightbulb, Brain, Microscope, FlaskConical, Atom,
  Calculator, Pencil, Ruler, Library, Zap, Star, Target, Bookmark, FileText,
  TestTube, TestTube2, Dna, Fingerprint, Telescope, Orbit,
  // Communication
  MessageSquare, MessageCircle, Mail, Phone, PhoneCall, Send,
  BellOff, AtSign, Inbox, MessageSquarePlus, Voicemail,
  // Files & Storage
  File, Folder, FolderOpen, FileCheck, FileX, FilePlus, FileMinus,
  Save, Download, Upload, Copy, Clipboard, ClipboardCheck, ClipboardList,
  FolderPlus, FolderX, HardDriveDownload, HardDriveUpload,
  // Time & Calendar
  Calendar, CalendarCheck, CalendarX, AlarmClock, Hourglass,
  // Media & Audio
  Camera, CameraOff, Video, VideoOff, Mic, MicOff, Headphones,
  Volume2, VolumeX, Volume1, Tv, Radio, Music, Podcast,
  Play, Pause, SkipForward, SkipBack, FastForward, Rewind,
  // Status & Alerts
  Check, CheckCircle, CheckCheck, XCircle, AlertCircle, AlertTriangle,
  AlertOctagon, Info, HelpCircle, Ban, CircleOff, ShieldCheck, ShieldX,
  // Nature & Weather
  Sun, Moon, Flame, Leaf, Mountain, Droplets, Snowflake, Wind,
  Waves, CloudRain, CloudLightning, Cloudy, Sunset, Sunrise, Rainbow,
  // Transport
  Car, Plane, Train, Rocket, MapPin, Bike, Navigation, Navigation2,
  Anchor, Compass, Truck, Bus, Ship,
  // Health & Medical
  Heart, HeartCrack, Pill, Stethoscope, Syringe, Bandage,
  // Commerce & Finance
  DollarSign, CreditCard, ShoppingCart, ShoppingBag, Wallet,
  Receipt, Store,
  // People & Social
  User, Users, UserPlus, UserMinus, UserCheck, Bot, Building, Building2,
  Bell, Timer, Flag, FlagTriangleRight,
  // Interface & Layout
  Search, Filter, Settings, Settings2, Eye, EyeOff,
  Columns, Rows, Grid3x3, Grid2x2, List, ListOrdered,
  ToggleLeft, ToggleRight, SlidersHorizontal, Sliders,
  Home, Menu, MoreHorizontal, MoreVertical, Maximize, Minimize,
  PanelLeft, PanelRight, PanelTop, PanelBottom,
  // Editing & Tools
  Scissors, Crop, Eraser, PenTool, Pen, Highlighter,
  Wand2, Brush, Palette, Pipette,
  // Miscellaneous
  Sparkles, Trophy, Award, Gift,
  Puzzle, Gem, Crown, Map, Globe2, LocateFixed, Crosshair, Focus,
} as Record<string, LucideIconComponent>

export const ICON_CATEGORIES: Record<string, string[]> = {
  'API': [
    'Webhook', 'Cable', 'Plug', 'Plug2', 'PlugZap', 'Unplug', 'Route',
    'RadioTower', 'Antenna', 'Link2', 'Parentheses', 'Regex', 'SquareCode',
    'Globe', 'Server', 'Database', 'Cloud', 'Network', 'Share2',
    'Code2', 'Braces', 'Hash', 'Binary', 'Terminal', 'ExternalLink', 'Link',
  ],
  'AI & ML': [
    'BrainCircuit', 'Brain', 'Bot', 'BotMessageSquare', 'CircuitBoard',
    'GitGraph', 'Spline', 'TreeDeciduous', 'TreePine',
    'Scan', 'ScanLine', 'ScanEye', 'Blocks', 'Cpu', 'Layers', 'Layers2',
    'Network', 'Sigma', 'Variable', 'FunctionSquare', 'Activity', 'TrendingUp',
    'BarChart3', 'LineChart', 'Shuffle', 'Workflow', 'Fingerprint', 'Eye',
  ],
  'Arrows': [
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRightLeft',
    'ArrowUpRight', 'ArrowDownRight', 'ArrowUpLeft', 'ArrowDownLeft',
    'ArrowBigRight', 'ArrowBigLeft', 'ArrowBigUp', 'ArrowBigDown',
    'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'ChevronsRight', 'ChevronsLeft', 'ChevronsUp', 'ChevronsDown',
    'CornerDownRight', 'CornerRightDown', 'CornerUpLeft', 'CornerUpRight',
    'MoveRight', 'MoveLeft', 'MoveUp', 'MoveDown', 'Move',
    'RotateCcw', 'RotateCw', 'RefreshCw', 'RefreshCcw', 'Repeat', 'Repeat2',
  ],
  'Flow & Logic': [
    'GitBranch', 'GitFork', 'GitMerge', 'GitCommit', 'GitPullRequest',
    'Workflow', 'Shuffle', 'Network', 'Share2', 'Split', 'Waypoints',
  ],
  'Code & Tech': [
    'Code2', 'Terminal', 'Monitor', 'Server', 'Database', 'Cloud', 'Globe', 'Wifi',
    'Cpu', 'HardDrive', 'BrainCircuit', 'Binary', 'Hash', 'Braces', 'FileCode',
    'Package', 'Boxes', 'Lock', 'Unlock', 'Shield', 'Key', 'Container',
    'Bug', 'Link', 'ExternalLink', 'Layers', 'Layers2', 'Laptop', 'Smartphone', 'Tablet',
  ],
  'Math & Data': [
    'Plus', 'Minus', 'X', 'Divide', 'Equal', 'Sigma', 'Percent', 'Pi', 'Infinity',
    'BarChart2', 'BarChart3', 'LineChart', 'PieChart', 'TrendingUp', 'TrendingDown',
    'Activity', 'Variable', 'FunctionSquare', 'Superscript', 'Subscript',
  ],
  'Education': [
    'BookOpen', 'Book', 'GraduationCap', 'Lightbulb', 'Brain', 'Microscope', 'FlaskConical',
    'Atom', 'Calculator', 'Pencil', 'Ruler', 'Library', 'Zap', 'Star', 'Target',
    'Bookmark', 'FileText', 'Telescope', 'Orbit',
  ],
  'Science': [
    'TestTube', 'TestTube2', 'Dna', 'Fingerprint', 'Microscope', 'Atom',
    'FlaskConical', 'Orbit', 'Telescope', 'Brain', 'BrainCircuit',
  ],
  'Communication': [
    'MessageSquare', 'MessageCircle', 'Mail', 'Phone', 'PhoneCall', 'Send',
    'Bell', 'BellOff', 'AtSign', 'Inbox', 'MessageSquarePlus', 'Voicemail',
  ],
  'Files & Storage': [
    'File', 'Folder', 'FolderOpen', 'FileCheck', 'FileX', 'FilePlus', 'FileMinus',
    'Save', 'Download', 'Upload', 'Copy', 'Clipboard', 'ClipboardCheck', 'ClipboardList',
    'FolderPlus', 'FolderX', 'HardDriveDownload', 'HardDriveUpload',
  ],
  'Time & Calendar': [
    'Calendar', 'CalendarCheck', 'CalendarX', 'AlarmClock', 'Hourglass',
    'Clock', 'Timer', 'Watch',
  ],
  'Media': [
    'Camera', 'CameraOff', 'Video', 'VideoOff', 'Mic', 'MicOff', 'Headphones',
    'Volume2', 'VolumeX', 'Volume1', 'Tv', 'Radio', 'Music', 'Podcast',
    'Play', 'Pause', 'SkipForward', 'SkipBack', 'FastForward', 'Rewind',
  ],
  'Status & Alerts': [
    'Check', 'CheckCircle', 'CheckCheck', 'XCircle', 'AlertCircle', 'AlertTriangle',
    'AlertOctagon', 'Info', 'HelpCircle', 'Ban', 'CircleOff', 'ShieldCheck', 'ShieldX',
  ],
  'Nature & Weather': [
    'Sun', 'Moon', 'Flame', 'Leaf', 'Mountain', 'Droplets', 'Snowflake', 'Wind',
    'Waves', 'CloudRain', 'CloudLightning', 'Cloudy', 'Sunset', 'Sunrise', 'Rainbow',
  ],
  'Transport': [
    'Car', 'Plane', 'Train', 'Rocket', 'MapPin', 'Bike', 'Navigation', 'Navigation2',
    'Anchor', 'Compass', 'Truck', 'Bus', 'Ship',
  ],
  'Health': [
    'Heart', 'HeartCrack', 'Pill', 'Stethoscope', 'Syringe', 'Bandage', 'Activity',
  ],
  'Commerce': [
    'DollarSign', 'CreditCard', 'ShoppingCart', 'ShoppingBag', 'Wallet',
    'Receipt', 'Tag', 'Store', 'Percent', 'TrendingUp',
  ],
  'People': [
    'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'Bot', 'Building', 'Building2', 'Flag', 'FlagTriangleRight',
  ],
  'Interface': [
    'Search', 'Filter', 'Settings', 'Settings2', 'Eye', 'EyeOff',
    'Columns', 'Rows', 'Grid3x3', 'Grid2x2', 'List', 'ListOrdered',
    'ToggleLeft', 'ToggleRight', 'SlidersHorizontal', 'Sliders',
    'Home', 'Menu', 'MoreHorizontal', 'MoreVertical', 'Maximize', 'Minimize',
    'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom',
  ],
  'Editing': [
    'Scissors', 'Crop', 'Eraser', 'PenTool', 'Pen', 'Highlighter',
    'Wand2', 'Brush', 'Palette', 'Pipette',
  ],
  'Misc': [
    'Sparkles', 'Trophy', 'Award', 'Gift', 'Puzzle', 'Gem', 'Crown',
    'Map', 'Globe2', 'LocateFixed', 'Crosshair', 'Focus',
  ],
}

export const ALL_CATEGORY = 'All'

/** Build SVG string for a given icon. Used by Konva canvas renderer. */
export function buildIconSvg(iconName: string, color: string, strokeWidth: number, size = 24): string {
  const Comp = ICON_MAP[iconName]
  if (!Comp) return ''
  const safeColor = color.replace(/"/g, '&quot;')
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

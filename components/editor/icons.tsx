import {
  Plus,
  LayoutGrid,
  Bookmark,
  Edit3,
  Type,
  Shapes,
  Plug,
  Settings,
  Play,
  Hand,
  MousePointer2,
  Share2,
  Moon,
  Sun,
  Map,
  Command,
  Zap,
  Globe,
  Database,
  FileText,
  MoreHorizontal,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  ImageIcon,
  Eraser,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  PenTool,
  Download,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ChevronDown,
  Check,
  Palette,
  Spline,
  Loader2,
} from "lucide-react"

const RoughSquare0 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="0" />
  </svg>
)

const RoughSquare1 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
)

const RoughSquare2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 5 Q6 4, 19 5 Q20 6, 19 19 Q18 20, 5 19 Q4 18, 5 5" />
  </svg>
)

export const Icons = {
  Plus,
  Layout: LayoutGrid,
  Saved: Bookmark,
  Edit: Edit3,
  Text: Type,
  Shapes,
  Plugins: Plug,
  Settings,
  Play,
  Hand,
  Cursor: MousePointer2,
  Share: Share2,
  Moon,
  Sun,
  Map,
  Command,
  Zap,
  Webhook: Globe,
  Database,
  File: FileText,
  More: MoreHorizontal,
  Square,
  Circle,
  Diamond,
  Arrow: ArrowRight,
  Line: Minus,
  Image: ImageIcon,
  Eraser,
  Lock,
  Unlock,
  Undo: Undo2,
  Redo: Redo2,
  Pen: PenTool,
  Download,
  Trash: Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ChevronDown,
  Check,
  Palette,
  Connector: Spline,
  RoughSquare0,
  RoughSquare1,
  RoughSquare2,
  Loader2, // Added Loader2 to exports
}

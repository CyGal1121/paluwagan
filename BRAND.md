# Pinoy Paluwagan Brand Kit

## Brand Identity

**App Name:** Pinoy Paluwagan
**Tagline:** Transparent and trusted savings circles for Filipinos
**Logo:** `/public/logo.png`

## Color Palette

### Primary Colors

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Primary** | `hsl(15, 70%, 45%)` | `#C2410C` | Buttons, links, brand elements |
| **Primary Foreground** | `hsl(0, 0%, 100%)` | `#FFFFFF` | Text on primary backgrounds |

### Secondary Colors

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Secondary** | `hsl(35, 30%, 90%)` | `#EDE5DB` | Secondary buttons, subtle backgrounds |
| **Secondary Foreground** | `hsl(20, 15%, 25%)` | `#4A3F35` | Text on secondary backgrounds |

### Accent Colors

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Accent** | `hsl(30, 50%, 55%)` | `#C98A4D` | Highlights, decorative elements |
| **Accent Foreground** | `hsl(0, 0%, 100%)` | `#FFFFFF` | Text on accent backgrounds |

### Semantic Colors

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Success** | `hsl(145, 60%, 40%)` | `#26A65B` | Success states, confirmations, paid status |
| **Warning** | `hsl(45, 90%, 55%)` | `#EAB308` | Warnings, pending states |
| **Destructive** | `hsl(0, 65%, 50%)` | `#D32F2F` | Errors, delete actions, overdue status |

### Neutral Colors

| Color | HSL | Hex | Usage |
|-------|-----|-----|-------|
| **Background** | `hsl(40, 33%, 98%)` | `#FDFBF7` | Page backgrounds |
| **Foreground** | `hsl(20, 15%, 15%)` | `#2D2620` | Primary text |
| **Card** | `hsl(0, 0%, 100%)` | `#FFFFFF` | Card backgrounds |
| **Muted** | `hsl(40, 20%, 94%)` | `#F3F0EA` | Subtle backgrounds, disabled states |
| **Muted Foreground** | `hsl(20, 10%, 45%)` | `#7A7067` | Secondary text, placeholders |
| **Border** | `hsl(30, 15%, 88%)` | `#E5DED5` | Borders, dividers |

### Role-Specific Colors

| Role | Color | HSL | Usage |
|------|-------|-----|-------|
| **Organizer** | Amber | `hsl(35, 92%, 33%)` | `#B45309` - Organizer badges, highlights |
| **Member** | Primary | `hsl(15, 70%, 45%)` | `#C2410C` - Member badges, highlights |

## Typography

### Font Family

```css
font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Font Sizes

| Size | Class | Usage |
|------|-------|-------|
| **4xl** | `text-4xl` (36px) | Hero headings |
| **3xl** | `text-3xl` (30px) | Page titles |
| **2xl** | `text-2xl` (24px) | Section headings |
| **xl** | `text-xl` (20px) | Card titles |
| **lg** | `text-lg` (18px) | Subheadings |
| **base** | `text-base` (16px) | Body text |
| **sm** | `text-sm` (14px) | Secondary text, labels |
| **xs** | `text-xs` (12px) | Captions, hints |

### Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| **Bold** | `font-bold` (700) | Headings, emphasis |
| **Semibold** | `font-semibold` (600) | Subheadings, buttons |
| **Medium** | `font-medium` (500) | Labels, navigation |
| **Normal** | `font-normal` (400) | Body text |

### Line Heights

- **Body text:** 1.6 (relaxed)
- **Headings:** 1.2 (tight)

## Spacing & Layout

### Border Radius

| Size | Variable | Value | Usage |
|------|----------|-------|-------|
| **sm** | `--radius-sm` | 8px | Small buttons, inputs |
| **md** | `--radius-md` | 10px | Cards, medium elements |
| **lg** | `--radius-lg` | 12px | Large cards, modals |
| **xl** | `--radius-xl` | 16px | Feature sections |
| **2xl** | `rounded-2xl` | 16px | Logo containers |
| **full** | `rounded-full` | 9999px | Avatars, badges |

### Touch Targets

- **Minimum touch target:** 44px (for mobile accessibility)
- **Button height:** 48px (`h-12`)
- **Input height:** 48px (`h-12`)

### Container Widths

- **Max content width:** 7xl (80rem / 1280px)
- **Auth forms:** md (28rem / 448px)
- **Cards:** Full width within container

## Components

### Buttons

```tsx
// Primary Button
<Button className="h-12 text-base">Action</Button>

// Secondary Button
<Button variant="outline" className="h-12">Action</Button>

// Destructive Button
<Button variant="destructive">Delete</Button>
```

### Cards

```tsx
<Card className="border-0 shadow-lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Avatars

```tsx
<Avatar className="h-8 w-8">
  <AvatarImage src={photoUrl} alt={name} />
  <AvatarFallback>{getInitials(name)}</AvatarFallback>
</Avatar>
```

### Status Badges

| Status | Color | Usage |
|--------|-------|-------|
| Paid/Confirmed | `text-success` + `bg-success/10` | Completed payments |
| Pending | `text-warning` + `bg-warning/10` | Awaiting confirmation |
| Unpaid/Overdue | `text-destructive` + `bg-destructive/10` | Missing payments |
| Active | `text-primary` + `bg-primary/10` | Active groups/cycles |

## Icons

**Icon Library:** Lucide React

### Common Icons

| Icon | Component | Usage |
|------|-----------|-------|
| Users | `<Users />` | Groups, members |
| Crown | `<Crown />` | Organizer role |
| Shield | `<Shield />` | Security, trust |
| TrendingUp | `<TrendingUp />` | Progress, growth |
| Bell | `<Bell />` | Notifications |
| Camera | `<Camera />` | Photo upload |
| Loader2 | `<Loader2 />` | Loading states (animate-spin) |
| Check | `<Check />` | Success, confirmed |
| X | `<X />` | Close, cancel |
| Plus | `<Plus />` | Add, create |

## Gradients & Effects

### Background Gradient

```css
bg-gradient-to-b from-background to-muted/50
```

### Backdrop Blur (Navigation)

```css
bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
```

### Shadow

```css
shadow-lg  /* Cards, elevated elements */
shadow-md  /* Buttons on hover */
```

## Animation

### Transitions

```css
transition-all duration-200  /* Standard transition */
transition-colors           /* Color-only transitions */
```

### Loading Spinner

```tsx
<Loader2 className="h-5 w-5 animate-spin" />
```

## Accessibility

- **Minimum contrast ratio:** 4.5:1 for normal text
- **Focus indicators:** Ring color matches primary
- **Touch targets:** Minimum 44px on mobile
- **Screen reader support:** Proper labels and ARIA attributes

## File Structure for Brand Assets

```
public/
├── logo.png           # Main logo (square, transparent background)
├── favicon.ico        # Browser favicon
└── manifest.json      # PWA manifest with brand colors
```

## Usage Examples

### Page Header

```tsx
<div className="text-center space-y-3">
  <img src="/logo.png" alt="Pinoy Paluwagan" className="w-20 h-20 mx-auto" />
  <h1 className="text-3xl font-bold text-foreground">Pinoy Paluwagan</h1>
  <p className="text-muted-foreground">Tagline here</p>
</div>
```

### Navigation Logo

```tsx
<Link href="/home" className="flex items-center space-x-2">
  <img src="/logo.png" alt="Pinoy Paluwagan" className="h-8 w-8" />
  <span className="text-lg font-bold text-primary">Paluwagan</span>
</Link>
```

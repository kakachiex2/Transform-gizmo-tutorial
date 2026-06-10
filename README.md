# Build a Complete Three.js Transform Gizmo System.

3D Transform gizmo from Blender to Three.js and Claude code or any other LLM.

Use this prompt with GPT-5, Claude, Gemini, DeepSeek, Qwen, Hermes, or any coding LLM.

![](C:\Users\rafae\AppData\Roaming\marktext\images\2026-06-09-20-49-08-3D-Transform-widget_02.png)

---

## ROLE

You are a senior graphics engineer, technical artist, Three.js architect, React developer, and DCC tools programmer.

Build a complete production-ready Transform Gizmo System inspired by Blender, Maya, Unity, and Unreal Engine.

The gizmo model is provided as a `.glb` file exported from Blender.

The application must be built using:

```txt
Vite
React
TypeScript
Three.js
React Three Fiber
Drei
Shadcn/UI
TailwindCSS
Lucide Icons
```

The code must be modular, maintainable, scalable, and follow modern React architecture.

---

# PROJECT GOAL

Create a reusable Transform Gizmo system capable of:

```txt
Translate
Rotate
Scale
Uniform Scale
Plane Translation
Axis Constraints
Snapping
Raycast Picking
Camera Facing Gizmo
Dynamic Gizmo Mirroring
Local Space
World Space
```

The gizmo is imported from a Blender GLB.

---

# APPLICATION REQUIREMENTS

Create a basic modeling sandbox scene.

The scene should contain:

```txt
Cube
Sphere
Cylinder
Cone
Torus
Plane Ground
Grid Helper
Axes Helper
```

Users can:

```txt
Select Object
Deselect Object
Transform Object
Switch Gizmo Mode
Switch Space Mode
Enable Snapping
```

---

# REQUIRED FOLDER STRUCTURE

```txt
src/

├── app/
│   ├── App.tsx
│   └── Layout.tsx
│
├── components/
│   ├── viewport/
│   │   ├── Viewport.tsx
│   │   ├── Scene.tsx
│   │   └── CameraController.tsx
│   │
│   ├── gizmo/
│   │   ├── TransformGizmo.tsx
│   │   ├── GizmoRaycast.ts
│   │   ├── GizmoTranslate.ts
│   │   ├── GizmoRotate.ts
│   │   ├── GizmoScale.ts
│   │   ├── GizmoMirror.ts
│   │   ├── GizmoSnap.ts
│   │   └── GizmoMaterials.ts
│   │
│   ├── primitives/
│   │   ├── Cube.tsx
│   │   ├── Sphere.tsx
│   │   ├── Cylinder.tsx
│   │   ├── Cone.tsx
│   │   └── Torus.tsx
│   │
│   └── ui/
│       ├── Toolbar.tsx
│       ├── Inspector.tsx
│       └── StatusBar.tsx
│
├── hooks/
│   ├── useSelection.ts
│   ├── useTransform.ts
│   ├── useRaycast.ts
│   └── useSnap.ts
│
├── store/
│   ├── sceneStore.ts
│   ├── gizmoStore.ts
│   └── selectionStore.ts
│
├── utils/
│   ├── math.ts
│   ├── transforms.ts
│   ├── snapping.ts
│   └── coordinateSystem.ts
│
├── assets/
│   └── TransformGizmo.glb
│
└── types/
    ├── gizmo.ts
    ├── transform.ts
    └── selection.ts
```

---

# GIZMO MODEL STRUCTURE

The GLB contains the following nodes:

```txt
pivot

translate_x
translate_y
translate_z

translate_xy
translate_xz
translate_yz

rotate_x
rotate_y
rotate_z

rotate_x_hit
rotate_y_hit
rotate_z_hit

scale_x
scale_y
scale_z

scale_uniform
```

---

# NODE INTERPRETATION

Translate:

```txt
translate_x
translate_y
translate_z
```

Axis movement.

---

Plane Translation:

```txt
translate_xy
translate_xz
translate_yz
```

Move on two axes.

---

Rotation:

```txt
rotate_x
rotate_y
rotate_z
```

Visible rotation arcs.

---

Rotation Raycast:

```txt
rotate_x_hit
rotate_y_hit
rotate_z_hit
```

Invisible thicker hit areas.

---

Scale:

```txt
scale_x
scale_y
scale_z
```

Axis scaling.

---

Uniform Scale:

```txt
scale_uniform
```

Uniform object scaling.

---

# GIZMO MODES

Create:

```ts
enum TransformMode {
  TRANSLATE,
  ROTATE,
  SCALE
}
```

---

Create:

```ts
enum TransformSpace {
  LOCAL,
  WORLD
}
```

---

# OBJECT SELECTION

Requirements:

```txt
Single Selection
Hover Highlight
Selection Outline
Deselection
Click Empty Space To Deselect
```

---

# RAYCAST SYSTEM

Use Three.js Raycaster.

When a gizmo handle is clicked:

```txt
Read node name
Determine mode
Determine axis
Begin drag operation
```

Example:

```ts
translate_x
→ Translate X

rotate_y
→ Rotate Y

scale_z
→ Scale Z
```

---

# TRANSLATE SYSTEM

Implement:

```txt
Translate X
Translate Y
Translate Z

Translate XY
Translate XZ
Translate YZ
```

Using drag planes.

Support:

```txt
Local Space
World Space
Grid Snap
```

---

# ROTATION SYSTEM

Implement:

```txt
Rotate X
Rotate Y
Rotate Z
```

Use:

```txt
Ray-plane intersection
Projected mouse movement
Quaternion rotation
```

Support:

```txt
5°
15°
45°
90°
Snap Rotation
```

---

# SCALE SYSTEM

Implement:

```txt
Scale X
Scale Y
Scale Z

Uniform Scale
```

Support:

```txt
Positive Scaling
Negative Scaling
Snap Scaling
```

---

# DYNAMIC CAMERA MIRRORING

IMPORTANT

The rotation widget is a custom triangular gizmo.

The visual representation must dynamically mirror based on camera position.

Do NOT hardcode quadrants.

Instead:

```txt
Convert camera position
into gizmo local space.
```

Example:

```ts
const localCamera =
gizmo.worldToLocal(
camera.position.clone()
)
```

Determine:

```txt
Camera Side
Camera Hemisphere
View Sector
```

Using:

```txt
Dot Products
Local Camera Position
```

Mirror:

```txt
Rotation Widget
Scale Widget
Plane Handles
```

to always face the camera correctly.

Behavior should resemble:

```txt
Blender
Unity
Maya
Unreal
```

---

# THREE.JS COORDINATE SYSTEM

Handle Blender → Three.js conversion.

Blender:

```txt
Z Up
```

Three.js:

```txt
Y Up
```

Implement automatic correction.

---

# UI REQUIREMENTS

Create a modern minimalist interface.

Use:

```txt
Shadcn/UI
Lucide Icons
```

Toolbar:

```txt
Move
Rotate
Scale

World
Local

Snap Toggle
```

Shortcuts:

```txt
W = Move
E = Rotate
R = Scale

Q = Select

X = Toggle X Axis
Y = Toggle Y Axis
Z = Toggle Z Axis

Shift = Snap
```

---

# DEBUG PANEL

Display:

```txt
Current Mode
Current Axis
Current Plane

Selected Object

World Position
Local Position

Rotation
Scale

Camera Position
Camera Sector
```

---

# CODE REQUIREMENTS

Generate:

```txt
Complete TypeScript

No pseudocode

No placeholders

No TODO comments

Production-ready code

Modular architecture

Strong typing

React hooks

Reusable systems
```

---

# BONUS FEATURES

If time permits:

```txt
Multi Selection
Bounding Box
Pivot Editing
Object Duplication
Undo / Redo
Transform History
Custom Hotkeys
```

---

# DELIVERABLES

Generate:

```txt
1. Full project structure

2. npm install commands

3. Vite setup

4. Tailwind setup

5. Shadcn setup

6. Zustand stores

7. Three.js scene

8. Primitive objects

9. GLB loading system

10. Raycast system

11. Transform gizmo implementation

12. Camera-facing mirror system

13. UI implementation

14. Keyboard shortcuts

15. Complete TypeScript source code
```

Build this as if it were the foundation of a lightweight Blender-style modeling application for Three.js / React Three Fiber.

# JavaScript Modules Documentation

This directory contains modularized JavaScript files for the nowtask application. The large files (render.js, events.js, modals.js, gauge.js) have been split into logical components for better maintainability and code organization.

## Module Structure

### Render Module (render-*.js)
The rendering logic has been split into 6 focused modules:

- **render-01-helpers.js** (150 lines)
  - Helper functions for date/time operations
  - `groupTasksByDate()`, `formatDate()`, `formatDateISO()`
  - UI setup functions

- **render-02-core-rendering.js** (677 lines)
  - Main task rendering functions
  - `renderTasks()`, `createTaskElement()`, `renderDateGroup()`
  - Task card creation and DOM manipulation

- **render-03-drag-drop.js** (555 lines)
  - Drag and drop functionality
  - `setupDragAndDrop()`, `getDragAfterElement()`
  - Task reordering logic

- **render-04-interactions.js** (342 lines)
  - Swipe handlers and context menus
  - `handleSwipeRight()`, `handleSwipeLeft()`
  - Task menu interactions

- **render-05-selection-bulk.js** (334 lines)
  - Multiple selection mode and bulk operations
  - `toggleSelectionMode()`, `bulkCompleteActions()`
  - Bulk edit functionality

- **render-06-quick-actions.js** (216 lines)
  - Quick action utilities
  - `quickCompleteToday()`, `quickMoveOverdueToTomorrow()`

### Events Module (events-*.js)
Event listeners split into 3 logical sections:

- **events-01-auth-header.js** (330 lines)
  - Authentication UI events
  - Header and menu button listeners
  - Login modal events

- **events-02-modals.js** (330 lines)
  - Modal dialog event handlers
  - Settings, analytics, templates, calendar events
  - Modal open/close listeners

- **events-03-task-input.js** (333 lines)
  - Task input field events
  - Form submission and validation
  - Real-time input handling

### Modals Module (modals-*.js)
Modal dialogs split into 4 components:

- **modals-01-create-edit.js** (250 lines)
  - Create and edit task modals
  - `openCreateModal()`, `openEditModal()`

- **modals-02-subtasks.js** (250 lines)
  - Subtask rendering and management
  - `renderSubtasksList()`, `addSubtask()`
  - Time calculation setup

- **modals-03-settings-routines.js** (250 lines)
  - Settings modal and routine management
  - `openSettingsModal()`, `renderRoutinesList()`
  - `deleteRoutine()`, `addRoutine()`

- **modals-04-auth-user.js** (232 lines)
  - Login modal and user information
  - `openLoginModal()`, `updateCurrentUserInfo()`
  - User session management

### Gauge Module (gauge-*.js)
Time gauge visualization split into 3 modules:

- **gauge-01-init.js** (300 lines)
  - Gauge initialization and date handling
  - `initGaugeDate()`, `changeGaugeDate()`
  - Swipe initialization

- **gauge-02-render.js** (220 lines)
  - Time gauge rendering (legacy)
  - `updateTimeGauge()`, `updateScheduledTasks()`

- **gauge-03-new-gauge.js** (216 lines)
  - New gauge implementation
  - `renderNewGauge()`, `renderGaugeTimeLabels()`
  - `updateNewGaugeTime()`

## Loading Order

The modules should be loaded in this order to ensure proper dependency resolution:

1. **Core modules** (no dependencies):
   - render-01-helpers.js
   - gauge-01-init.js

2. **Utility modules**:
   - events-03-task-input.js
   - modals-01-create-edit.js

3. **Rendering modules**:
   - render-02-core-rendering.js
   - render-03-drag-drop.js
   - gauge-02-render.js

4. **Interactive modules**:
   - render-04-interactions.js
   - render-05-selection-bulk.js
   - render-06-quick-actions.js
   - gauge-03-new-gauge.js

5. **Modal modules**:
   - modals-02-subtasks.js
   - modals-03-settings-routines.js
   - modals-04-auth-user.js

6. **Event listeners** (should be loaded last):
   - events-01-auth-header.js
   - events-02-modals.js

## HTML Integration

To use these modules, include them in your HTML in the proper order:

```html
<!-- Core helpers -->
<script src="js/render-01-helpers.js"></script>
<script src="js/gauge-01-init.js"></script>

<!-- Utilities -->
<script src="js/events-03-task-input.js"></script>
<script src="js/modals-01-create-edit.js"></script>

<!-- Rendering -->
<script src="js/render-02-core-rendering.js"></script>
<script src="js/render-03-drag-drop.js"></script>
<script src="js/gauge-02-render.js"></script>

<!-- Interactive -->
<script src="js/render-04-interactions.js"></script>
<script src="js/render-05-selection-bulk.js"></script>
<script src="js/render-06-quick-actions.js"></script>
<script src="js/gauge-03-new-gauge.js"></script>

<!-- Modals -->
<script src="js/modals-02-subtasks.js"></script>
<script src="js/modals-03-settings-routines.js"></script>
<script src="js/modals-04-auth-user.js"></script>

<!-- Event listeners -->
<script src="js/events-01-auth-header.js"></script>
<script src="js/events-02-modals.js"></script>
```

## Migration Notes

- The original monolithic files (render.js, events.js, modals.js, gauge.js) are still present
- Once the modules are integrated and tested, the original files can be removed
- All module content has been extracted directly from the originals without modifications
- Global variables and function calls remain unchanged

## Benefits

1. **Better maintainability**: Smaller, focused files are easier to understand and modify
2. **Faster development**: Easier to locate and update specific functionality
3. **Performance**: Can potentially lazy-load modules as needed
4. **Testing**: Smaller modules are easier to unit test
5. **Collaboration**: Multiple developers can work on different modules

## Future Improvements

- Consider converting modules to ES6 modules with import/export
- Implement lazy loading for performance optimization
- Create a module bundler configuration
- Add JSDoc comments for better IDE support

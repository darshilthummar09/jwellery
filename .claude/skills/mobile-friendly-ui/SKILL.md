# Mobile-First Requirement

> **IMPORTANT:** This project is primarily used on mobile devices, so mobile must be treated as the **PRIMARY design target**.

Do **NOT** design the desktop version first and simply make it responsive.

Build the UI with a true **MOBILE-FIRST** approach.

The application must work properly across a wide range of mobile screen sizes, including:

- Small mobile devices
- Standard mobile devices
- Large mobile devices
- Different Android screen sizes
- Different iPhone screen sizes
- Portrait orientation
- Landscape orientation

The UI must adapt smoothly to different viewport widths and heights without breaking.

---

## 1. Responsive Layout

- No horizontal scrolling anywhere unless absolutely required.
- No content should be cut off.
- No overlapping elements.
- No fixed-width layouts that break on small screens.
- Use fluid widths and responsive spacing.
- Use appropriate CSS breakpoints.
- Use `max-width` where necessary.
- Make all components adapt naturally to available screen space.

---

## 2. Touch-Friendly UI

Since users will mainly interact through touch:

- Buttons must be comfortable to tap.
- Inputs must be easy to use.
- Dropdowns/selects must be mobile-friendly.
- Checkboxes/radio buttons must have sufficient touch area.
- Icons used as actions must have proper clickable areas.
- Avoid very small text or controls.
- Avoid interactions that require precise mouse movement.

---

## 3. Mobile Navigation

The admin navigation/sidebar must be properly designed for mobile.

If the existing sidebar is not suitable for mobile:

- Convert it into a drawer/mobile menu.
- Keep navigation easy to access.
- Do not allow the sidebar to cover important content unnecessarily.
- Make sure the menu can be opened and closed easily.

---

## 4. Mobile Dashboard

The admin dashboard should be designed specifically for mobile.

Client information should be displayed in an easy-to-scan format.

Avoid forcing users to view large desktop-style tables on mobile.

Use:

- Cards
- Stacked sections
- Responsive lists
- Compact information blocks

where appropriate.

---

## 5. Mobile Orders

The Orders section must be highly usable on mobile.

Each order should clearly show important information such as:

- Order information
- Client
- Date
- Priority
- Status
- Other existing important information

If the existing desktop table does not work well on mobile, transform it into a responsive card/list layout for mobile while keeping the table layout on larger screens.

---

## 6. Mobile Filters

The order date filter must be very easy to use on mobile.

Filters should:

- Fit within the screen.
- Stack vertically when required.
- Have comfortable input sizes.
- Be easy to open and close.
- Not cause horizontal scrolling.

---

## 7. Mobile Forms

The Create Order form must be designed for mobile first.

- Inputs should use the full available width.
- Fields should be properly spaced.
- Labels should be clearly visible.
- Buttons should be easy to tap.
- Long forms should be divided into logical sections.
- Avoid unnecessary multi-column layouts on mobile.
- Use one-column layouts where appropriate.

---

## 8. Mobile Typography

Typography must remain readable on small screens.

- Do not use excessively small fonts.
- Maintain clear heading hierarchy.
- Prevent text from overflowing.
- Handle long client names/order names gracefully.
- Use ellipsis or wrapping where appropriate.

---

## 9. Mobile Images

All images should be responsive.

- Maintain proper aspect ratios.
- Prevent images from overflowing containers.
- Use appropriate `object-fit` behavior.
- Make uploaded order images easy to view on mobile.
- If there are image galleries, make them touch-friendly.

---

## 10. Mobile Modals / Drawers

Any modal, popup, dialog, or drawer must work properly on small screens.

On mobile:

- Avoid dialogs that exceed the viewport.
- Allow scrolling inside long dialogs when necessary.
- Keep important actions visible.
- Make close buttons easy to tap.
- Do not allow content to get hidden behind browser UI.

---

## 11. Different Screen Sizes

Do not optimize for only one mobile width such as `375px` or `390px`.

Test and account for different widths, for example:

- `320px`
- `360px`
- `375px`
- `390px`
- `414px`
- `430px`
- `480px+`

The layout should gracefully adapt between these sizes.

---

## 12. Safe Areas

Consider modern mobile devices with:

- Notches
- Rounded corners
- Dynamic browser address bars
- Safe-area insets

Do not place important buttons or content too close to screen edges.

---

## 13. Performance

Because this is primarily a mobile application:

- Avoid unnecessary heavy animations.
- Avoid excessive effects.
- Avoid unnecessarily large images.
- Keep interactions fast.
- Avoid layout shifts.
- Keep the UI lightweight.

---

## 14. Final Mobile Quality Check

Before considering the work complete, check the entire application specifically on mobile.

Verify:

- [ ] No horizontal overflow
- [ ] No broken layouts
- [ ] No overlapping elements
- [ ] No clipped text
- [ ] No inaccessible buttons
- [ ] No unusable forms
- [ ] No broken navigation
- [ ] No broken modals
- [ ] No broken tables
- [ ] No broken filters
- [ ] No broken images
- [ ] No desktop-only interactions
- [ ] No elements extending outside the viewport

---

# Important

Mobile responsiveness is **NOT an optional enhancement** for this project.

**MOBILE IS THE PRIMARY PLATFORM.**

The final UI should feel like a **professionally designed mobile-first application**, not a desktop website squeezed into a mobile screen.
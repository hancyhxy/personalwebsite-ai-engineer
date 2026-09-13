![cover](./public/cover.png)
# Content-Driven Food Delivery Experience

### Project Brief
- Date: 2023
- Project Name: Content-Driven Food Delivery Experience
- Tag: Short-Video Commerce, End-to-End, Low-Friction Usability
- Company: TikTok, Local Life

### Introduction
This project introduced TikTok’s “Order Now, Deliver Later” food-delivery mechanism, allowing users to collect delivery vouchers during live streams or short videos and redeem them later when they actually want to eat.
Although the operation strategy behind this mechanism was innovative, the design direction was intentionally restrained.
Our goal was not to add new gameplay, but to make this experience feel like a natural extension of the existing voucher logic users already understood.
![timetable](./public/timetable.png)

To achieve this, we focused on two priorities:
**For Users — Zero Friction Adoption**
Make “Order Now, Deliver Later” vouchers behave exactly like familiar in-store vouchers, reducing cognitive load and keeping existing flows intact.
**For Merchants — Minimal Operational Cost**
Allow merchants to configure delivery items quickly with low maintenance and low onboarding effort, ensuring the model can scale efficiently.
This restrained, system-first approach helped a new business idea land smoothly on both ends—intuitive for users, and operationally sustainable for merchants.

### Overview
TikTok Local Life explored how food delivery could support not only immediate hunger, but also future cravings triggered by content.
Users might feel inspired in a live stream—“this looks amazing!”—but they usually are not hungry right now.
![orderfirst](./public/orderfirst.png)
I led the product design for a new “Store-Now-Deliver-Later” mechanism that lets users collect meal vouchers during content consumption and redeem them later when they actually want to eat.
![problem-role](./public/problem-role.png)
The new chain:
Content inspiration → Collect voucher → Store future intent → Activate later → Delivery

### User-Side Design
#### Restrained, Familiar UX: Embedding Delivery Inside Existing Voucher Logic
The goal was to make the new mechanism feel like it already belonged in the ecosystem.
- Reused the same visual and interaction patterns as existing in-store vouchers
- Placed “collect delivery voucher” at familiar touchpoints
- No new concepts or extra education required
- Entire main funnel remained uninterrupted
This ensured the innovation happened at the business level, not at the cost of user experience complexity.

#### Seamlessly Embedding “Food Delivery” Within an Existing In-Store Voucher System
Food delivery and in-store vouchers were originally two separate ecosystems.
My goal was to introduce the new mechanism without disrupting the main user flow:
- Reused the exact voucher visual pattern users were already familiar with
- Placed “collect delivery voucher” at the same interaction point as in-store vouchers
- Avoided additional onboarding or new learning for users
- Ensured existing conversion funnels remained untouched
This allowed the delivery scenario to integrate naturally into TikTok’s current commerce structure.

#### Converting Emotional Impulse into Stored Intent
Most content-driven craving happens before actual hunger.
I redesigned the content-side UX to safely capture and store this impulse:
- Lightweight “Collect Now / Order Later” overlays
- Clear promise: “refundable anytime”
- Vouchers saved in the user wallet for later use
- No pressure to order immediately
This transformed momentary emotion into future conversion potential.

#### Time-Gap Activation: Reawakening Intent When Hunger Arrives
To bridge the delay between inspiration and actual need, I designed a complete activation system:
- Smart reminders (push + feed cards)
- Voucher detection when user enters the delivery flow
- Auto-matching products tied to the voucher
- Pathway that naturally encourages voucher usage
Users only need to be inspired once — the system handles the rest.
![appinterface](./public/appinterface.png)

### Merchant-Side Design
#### Merchant-Side Architecture: Low-Cost, Fast-to-Run Configuration
To help merchants adopt this new model without extra burden, I designed:
- One-click duplication of dine-in menu → delivery menu
- Delivery-specific settings (pricing, inventory, packaging)
- A unified structure that allows consistency but preserves necessary differences
- Minimal maintenance overhead for large-scale rollout
This ensured the model could grow operationally, not just conceptually.
[View Merchant Backend Platform](https://www.life-partner.cn/site)
![merchantservice](./public/merchantservice.png)

### Process
#### 1. Cross-Domain Alignment
Synced product, content, voucher, delivery, and merchant ops teams to build an end-to-end mechanism.
#### 2. Designing the Store-Now-Use-Later Experience
Voucher logic, UX flows, refund rules, merchant mapping, and product structures.
#### 3. A/B Testing Conversion Triggers
Examined timing, UI patterns, and activation strategies to maximize re-engagement.

### Outcome
- Improved post-live order conversion and repeat user rate
- Established a reusable framework for other verticals (beauty, retail)
- Demonstrated TikTok’s potential to link “content → intent → transaction”

### Reflection
This project strengthened my ability to design system-level, restrained UX that serves complex business innovation:
- Capture emotional desire at the right moment
- Store it without adding friction to any flow
- Reactivate it at the exact moment of need
- All while keeping merchant operations simple and scalable
It taught me to balance business creativity with UX discipline, and to design for both sides of the ecosystem—users and merchants.
![cover](./public/cover.png)

# Customer Service Workspace & AI Chatbot for Taobao

### Project Brief
- Date: 2021.06
- Project Name: Customer Service Workspace & AI Chatbot
- Tag: UX Design, AI Chatbot, Customer Service
- Company: Alibaba

### Overview
**Chatbot, Help Center, and Agent Workspace Modules**
![overview](./public/overview.png)
I designed key components of Taobao’s merchant-facing customer service ecosystem, supporting 200,000 daily inquiries on China’s largest e-commerce platform.
![challengeandrole](./public/challengeandrole.png)
The project consists of two major product surfaces:
- Merchant Self-Service (Chatbot + Help Center) — fully designed by me
- Agent Workspace (Internal Customer Service Platform) — I owned several core modules
The shared goal was to reduce support load while helping merchants resolve operational issues quickly and accurately.

### Merchant Self-Service: Chatbot & Help Center
![appinall](./public/appinall.png)
![approach](./public/approach.png)
**Role: Lead Designer (sole designer responsible for this entire track)**
Merchants often face operational, policy, and fulfillment questions that are more complex than consumer inquiries. I designed a complete self-service experience that allows sellers to diagnose and resolve issues without relying on human agents.
#### Chatbot System (End-to-End)
I independently designed the full Chatbot solution, including:
- **Conversation Architecture:** Multi-layer decision tree tailored to merchant workflows (orders, fulfillment, promotions, rules, seller tools, etc.)
- **Interaction Flow Design:** Guided questioning, context-aware branching, and progressive disclosure to prevent overload
- **Smart Linking with Help Center:**Bot automatically surfaces relevant help articles based on intent
- **UI Patterns & Quick Actions:** Message components, reply buttons, action shortcuts for faster task completion
Message components, reply buttons, action shortcuts for faster task completion
![workspace interface](./public/1.png)
![workspace dashboard](./public/2.png)
![chatbot interface examples](./public/bot2.png)
#### Help Center Information Architecture
- Rebuilt the entire IA based on merchant journeys
- Standardized article structures for clarity
- Designed linking logic between articles and Chatbot pathways
![chatbot conversation flow](./public/bot1.png)
![chatbot UI details](./public/bot3.png)
![chatbot interaction patterns](./public/2-8.png)
#### Innovation Patent: Plugin for a Tone-Customization Chatbot
As a self-initiated exploration, I collaborated with a designer friend, a product friend, and an algorithm friend to prototype a lightweight tone-customization plugin for the Chatbot, aiming to let NLP and CS operations teams adjust the AI assistant’s communication style for different merchant profiles and service scenarios. The concept centered on two simple but high-impact ideas —
- quick tone switching with clear, instant previews
- direct application of tone presets to AI-generated replies for brand-consistent responses
creating an experience that felt intuitive, controllable, and easy to operationalize. The prototype was well-received by the NLP team and later informed broader discussions around personalized AI response generation.\
![plugin](./public/plugin.png)

### Agent Workspace: Core Modules I Owned
*Agent Workspace is a large mission-critical internal tool. I contributed to several high-impact modules that directly shape the daily workflow of customer service agents.*   
#### Intelligent Reply Module (Real-time Assistance)
I designed the intelligent features inside the chat handling area:
- **AI-Powered Reply Suggestions** triggered by real-time agent typing
- **Unified Reply Panel** combining AI suggestions, knowledge-base search, and quick phrases
- **Quick Phrase System** including categorization, search, and insert patterns
This module reduces response time and improves consistency across agents.
#### Ticketing System (Forms & Details)
I owned key flows within the ticketing system:
- Ticket creation forms
- Ticket detail pages
- Information layout, state transitions, escalation logic
#### Merchant Onboarding & Back-Office Configuration
- Designed several foundational configuration pages
- Included field management, permission toggles, and operational setup workflows
![xixikf](./public/xixikf.png)
[Xixi Service OS](https://xixikf.com/)

### Outcome
- Chatbot achieved high self-service resolution and became the default first step for merchant troubleshooting
- Workspace intelligent features reduced agent workload and improved handling efficiency
- Components from this project were later integrated into Alibaba’s enterprise customer service platform
- Strengthened alignment between self-service and human-assisted service, improving end-to-end support experience for merchants

### Contribution Summary
- Sole designer for the entire merchant-facing Chatbot & Help Center system, including end-to-end conversation architecture, IA redesign, and UI patterns.
- Designed core intelligent modules within the Agent Workspace, such as AI reply suggestions, unified reply panel, quick phrases, and key ticketing flows.
- Delivered interaction models that balanced high-volume operational demands with clarity, speed, and scalability.
- Collaborated with PMs, NLP engineers, and service operations teams to ensure real-world feasibility, accuracy, and performance in production.

### Design Reflection
My design approach focused on balancing complexity, scalability, and clarity within a high-volume customer service environment.
I grounded the work in three principles:
#### 1. System Thinking for Multi-Endpoint Consistency
I treated the merchant Chatbot, Help Center, and Agent Workspace as a unified service ecosystem rather than isolated features.
Every design decision—IA, flows, response logic, or UI patterns—was evaluated for cross-end consistency and long-term scalability.
#### 2. Progressive Disclosure for Cognitive Load Reduction
Merchant issues can involve tools, policies, logistics, and platform rules.
I designed both the Chatbot and Workspace flows around progressive disclosure, revealing information step-by-step to keep users focused and avoid overwhelming them.
#### 3. Human–AI Collaboration as a Core Interaction Model
Whether on the merchant side or agent side, automation and AI suggestions were intentionally embedded as supportive guidance, not as disruptive intervention.
The goal was to empower users—merchants and agents—to act more confidently and faster with context-aware assistance.
This approach enabled the entire service system to feel coherent, intuitive, and operationally efficient across very different user groups.

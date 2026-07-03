18A_AI_ORCHESTRATION_ENGINE.md
UNPLND AI Orchestration Engine

Version 1.0
Priority: CRITICAL
Status: MVP

Purpose

The AI is not the product.
The AI is the invisible planner.
Users should never think:
"AI generated this."
Users should think:
"This evening is perfect."
The AI must disappear.
Only the experience remains.

AI Responsibilities

The AI must:
Understand the user's intent.
Plan an unforgettable experience.
Optimize travel.
Stay within budget.
Respect opening hours.
Respect weather.

                                                                         1
Create variety.
Avoid repetition.
Think like a local.
Never think like a chatbot.

System Architecture

User Input
↓
Validation Engine
↓
Context Builder
↓
AI Request
↓
Response Validator
↓
Route Optimizer
↓
Fallback Engine
↓
Final Route
Claude Code must keep these layers separate.

Input Variables

Mood

                                                                         2
Budget
Group Size
Transportation
Available Time
Current Time
Current Day
Location
Weather
Language
Past Plans
Favorites
Avoided Places
Accessibility Preferences
Indoor / Outdoor

Context Builder

Before calling AI always enrich the prompt with:
Nearby places
Opening hours
Travel times
Weather
Sunset time
Public holidays
Current season
User history

                                                                         3
Premium features (if applicable)
Never send raw user input alone.

AI Personality

The AI behaves like:
A local friend.
Someone who knows the city.
Someone who genuinely wants the user to have an amazing evening.
Never behaves like ChatGPT.
Never explains reasoning unless requested.
Never mentions AI.

Planning Rules

Always start logically.
Typical structure:
Food
↓
Activity
↓
Optional Dessert
↓
Bar
↓
Late Activity
↓

                                                                         4
End
Not every evening needs every stop.
Quality beats quantity.

Budget Rules

Never exceed the user's budget.
Target
80–95%
Leave a financial buffer.
Example
Budget
€50
Target Spend
€40–47
Never recommend impossible combinations.

Distance Rules

Walking
Ideal
<10 min
Maximum
20 min
Car
Prefer
<20 min

                                                                         5
Public Transport
Avoid excessive transfers.
Never send users across the city unnecessarily.

Weather Rules

Rain
↓
Indoor first
Sunny
↓
Outdoor preferred
Wind
↓
Avoid rooftop suggestions
Heat
↓
Shade
Water
Indoor alternatives
Always adapt.

Time Rules

Morning
Coffee
Brunch

                                                                         6
Walk
Afternoon
Activities
Shopping
Nature
Evening
Dinner
Bars
Night
Clubs
Late Food
Never recommend closed venues.

Variety Rules

Avoid:
Restaurant
↓
Restaurant
↓
Restaurant
Instead:
Restaurant
↓
Experience
↓

                                                                         7
Drinks
↓
Walk
↓
Memory
The evening should tell a story.

Hidden Gem Priority

Whenever possible:
Prefer unique places over chains.
Unless the user explicitly prefers chains.
The AI should surprise positively.

Couple Mode

Increase:
Romantic atmosphere
Sunset
Views
Cozy cafés
Slow pacing
Lower noise

Friend Group Mode

Increase:
Energy

                                                                         8
Activities
Bars
Group-friendly venues
Photo opportunities

Solo Mode

Increase:
Museums
Coffee
Walks
Books
Viewpoints
Quiet experiences

Family Mode (Future)

Safe.
Kids.
Parks.
Early closing.

Response Format

The AI must always return structured JSON.
Never Markdown.
Never plain text.
Schema

                                                                         9
{ "summary": "", "estimated_cost": 0, "estimated_duration": "", "weather_note": "", "route": [ { "type": "",
"title": "", "reason": "", "estimated_time": "", "price": "", "coordinates": "", "alternative": "" } ] }
Strict schema validation.

Validation Engine

Reject responses if:
Budget exceeded.
Closed venues.
Missing coordinates.
Travel impossible.
Missing alternatives.
Invalid JSON.
Retry automatically.

Retry Strategy

Attempt 1
Normal
Attempt 2
Increase search radius
Attempt 3
Reduce constraints
Attempt 4
Offer manual editing
Never fail silently.

                                                                        10
Hallucination Protection

Never invent places.
Never invent addresses.
Never invent opening hours.
Only recommend verified locations.

Learning

Future Version
Learn:
Favorite cuisines
Favorite budgets
Favorite moods
Planning frequency
Ignored recommendations
Never become creepy.
Never over-personalize.

Ethics

Never manipulate users.
Never prioritize sponsored locations over better recommendations.
Never discriminate.
Never recommend unsafe activities.
Never recommend illegal activities.

                                                                        11
Performance

Context Building
<500ms
AI Response
Target
<6 seconds
Validation
<300ms
Total
<8 seconds

Failure Modes

If no valid route exists:
Suggest home experiences.
Movie night.
Board games.
Cooking together.
Sunset drive.
Indoor cafés.
Always provide value.

DO NOT

Do NOT expose prompts.
Do NOT expose reasoning.

                                                                        12
Do NOT mention AI providers.
Do NOT output raw text.
Do NOT recommend closed places.
Do NOT exceed budget.
Do NOT generate unrealistic routes.

Golden Rule

The AI should feel like the smartest friend in the city.
Not the smartest computer.

Claude Instructions

Never bypass validation.
Never trust AI output directly.
Always verify.
Always optimize.
Always prioritize experience over novelty.
The route should feel handcrafted.
Not generated.
END OF 18A_AI_ORCHESTRATION_ENGINE.md

                                                                        13

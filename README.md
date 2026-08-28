# MaaSaathi

## Multilingual Maternity Care Companion

MaaSaathi is a simple web application for pregnant women and new mothers. It provides pregnancy tracking, health-awareness information, appointment reminders, basic maternity tools, newborn-care tracking, emergency contacts, and an AI chat assistant.

The application supports English and Hindi. User information is saved in the browser so that it remains available after refreshing the page.

## Problem it solves

Many mothers may find it difficult to access understandable healthcare information in their preferred language. MaaSaathi brings basic pregnancy and newborn-care awareness, preventive-care reminders, and healthcare-resource information together in one simple application.

## Main features

- Pregnancy due-date and week tracker.

- Pregnancy health-awareness information.

- Vaccination-awareness information.

- Maternal nutrition guidance.

- Mother and newborn-care information.

- Symptom and health log.

- Appointment and reminder list.

- Baby kick counter and contraction timer.

- Hospital-bag and preparation checklists.

- Baby feeding and weight tracker.

- Emergency contact and hospital-resource page.

- AI chat assistant using Gemini or Groq when configured.

- Demo AI responses when no API key is available.

- English and Hindi language support.

- Local data saving and JSON data export.

## How data is saved

MaaSaathi saves profile information, symptoms, appointments, checklists, chat messages, pregnancy tools, and baby-care records in browser localStorage. This means the data remains after a refresh on the same browser and device.

The Node.js server also includes a small embedded JSON data file for the demo server. This is not a secure multi-user healthcare database. A production version would require authentication, a secure database, access control, encryption, and verified healthcare-resource data.

## AI personalization

When the user asks a question, the application can send relevant saved information to the AI, such as the user’s name, pregnancy status, estimated pregnancy week, upcoming appointment, and recent symptoms. The AI is instructed to respond in the selected language and provide general awareness information.

The AI must not be used for diagnosis, medical-test interpretation, medicine dosage, or treatment decisions.

## Emergency safety

The application includes an emergency page and basic warning-word detection. When a possible warning sign is entered, the app shows an urgent-care message and directs the user to contact local emergency services, an emergency contact, or a healthcare professional.

Hospital information included for demonstration is prototype data. It must be replaced with verified local information before any real-world use. In an emergency, users should contact their local emergency services or visit the nearest hospital.

## Technology used

- HTML, CSS, and JavaScript.

- Node.js and Express for the optional backend.

- Gemini or Groq for optional live AI responses.

- Browser localStorage for simple persistence.

- Embedded JSON storage for the demo server.

## Project limitations

MaaSaathi is a hackathon prototype for educational and demonstration purposes. It does not replace doctors or healthcare workers. It does not diagnose conditions, prescribe medicines, or provide emergency treatment. Do not use fictional hospital information for a real emergency.

## Project status

This project is submitted as a working prototype for the **AI for Healthcare Awareness & Access** track. It demonstrates multilingual access, preventive healthcare awareness, maternal and newborn-care information, AI assistance, basic tracking, and connection to emergency resources.

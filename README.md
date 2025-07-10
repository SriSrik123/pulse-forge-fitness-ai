# Welcome to your project

## Project info

This is your fitness tracking application.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will be reflected in your remote repository.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:


# Step 1: Clone the repository using its Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
Edit a file directly in GitHub

Navigate to the desired file(s).

Click the "Edit" button (pencil icon) at the top right of the file view.

Make your changes and commit the changes.

Use GitHub Codespaces

Navigate to the main page of your repository.

Click on the "Code" button (green button) near the top right.

Select the "Codespaces" tab.

Click on "New codespace" to launch a new Codespace environment.

Edit files directly within the Codespace and commit and push your changes once you're done.

What technologies are used for this project?
This project is built with:

Vite

TypeScript

React

shadcn-ui

Tailwind CSS

How can I deploy this project?
To deploy your web application, you typically build it for production and then host the generated static files on a web server or a static site hosting service. For mobile apps (iOS and Android), you will use Capacitor to build native binaries and then publish them to the respective app stores.

For web deployment, run:

Bash
npm run build
This will create a dist folder with your production-ready web assets. You can then upload these contents to any static web host (e.g., Netlify, Vercel, Firebase Hosting, Apache/Nginx server).

For mobile deployment, after building the web assets (npm run build), you can use Capacitor to prepare native projects:

Bash
npx cap sync ios
npx cap open ios # To open in Xcode for iOS app store submission
npx cap sync android
npx cap open android # To open in Android Studio for Google Play Store submission
You would then follow the standard submission processes for the Apple App Store and Google Play Store.

Can I connect a custom domain to my hosted project?
Yes, if you deploy your web application to a hosting service, you can typically connect a custom domain through that service's configuration settings. Refer to your chosen hosting provider's documentation for specific instructions.

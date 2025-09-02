// This file defines the application routes and ensures proper navigation

export const routes = {
  home: "/",
  explore: "/music",
  signin: "/signin",
  register: "/register",
  studio: "/studio",
  create: "/create",
  editor: "/editor",
}

// Helper function to navigate to a route
export function navigateTo(route: keyof typeof routes) {
  return routes[route]
}


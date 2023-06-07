export default class {
    constructor(root, routes, error404) {
        this.root = root;
        this.routes = routes;
        this.error404 = error404;

        // Add a popstate event listener to handle browser navigation
        window.addEventListener('popstate', async () => {
            // Get the corresponding route based on the current URL
            const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;

            // Render the route's content and perform post-render actions
            this.root.innerHTML = route.render();
            route.postRender();
        });
    }

    // Handler for the DOMContentLoaded event
    DOMContentLoadedHandler() {
        // Get the corresponding route based on the current URL
        const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;

        // Render the route's content and perform post-render actions
        this.root.innerHTML = route.render();
        route.postRender();

        // Dispatch a custom "route" event
        this.dispatch();
    }

    // Dispatch a custom "route" event
    dispatch() {
        const routeEvent = new Event("route");
        dispatchEvent(routeEvent);
    }

    // Navigate to a specific pathname
    async navigate(event, pathname) {
        if (event) event.preventDefault();

        // Push the new state to the browser history
        window.history.pushState(
            {},
            pathname,
            window.location.origin + pathname
        );

        // Get the corresponding route based on the new URL
        const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;

        // Render the route's content and perform post-render actions
        this.root.innerHTML = route.render();
        route.postRender();

        // Dispatch a custom "route" event
        this.dispatch();
    }
}

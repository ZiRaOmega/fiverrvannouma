
export default class {
    
    constructor(root, routes, error404) {
        this.root = root;
        this.routes = routes;
        this.error404 = error404;
        
        window.addEventListener('popstate', async () => {
            const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;
            this.root.innerHTML = route.render();
            route.postRender();
        });
    }

    DOMContentLoadedHandler() {
        const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;
        this.root.innerHTML = route.render();
        route.postRender();

        this.dispatch();
    }

    dispatch() {
        const routeEvent = new Event("route");
        dispatchEvent(routeEvent);
    }

    async navigate(event, pathname) {
        if (event) event.preventDefault();

        window.history.pushState(
            {},
            pathname,
            window.location.origin + pathname
        );

        const route = this.routes[window.location.pathname] ? this.routes[window.location.pathname] : this.error404;
        this.root.innerHTML = route.render();
        route.postRender();

        this.dispatch();
    }
};

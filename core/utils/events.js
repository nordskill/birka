/**
 * Represents an event bus for managing and emitting events.
 * 
 * @example
 * // Create an instance of the EventBus
 * const userEvents = new EventBus();
 * 
 * // Define an event listener
 * function handleEvent(data) {
 *   console.log('Event emitted:', data);
 * }
 * 
 * // Add the event listener
 * userEvents.on('login', handleEvent);
 * 
 * // Emit an event
 * userEvents.emit('login', { name: 'John Doe' });
 * 
 * // Remove the event listener
 * userEvents.off('login', handleEvent);
 */
class EventBus {

    constructor() {
        this.events = {};
    }

    // Add event listeners
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }


    emit(eventName, data) {
        const event = this.events[eventName];
        if (event) {
            event.forEach(callback => callback(data));
        }
    }

    // Remove event listeners
    off(eventName, callback) {
        const event = this.events[eventName];
        if (event) {
            this.events[eventName] = event.filter(cb => cb !== callback);
        }
    }

}

export default EventBus;
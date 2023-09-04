import Step from 'shepherd.js/src/types/step';

export const builtInButtons = {
    cancel: {
        classes: 'cancel-button large-round',
        // secondary: true,
        text: 'Got it',
        type: 'cancel',
        events: {
            click: function() {
                // return Shepherd.activeTour.show('some_step_name');
                alert('asdfasfdasdf');
                console.log('asdfasdfasdfasdf');
            }
        }
    },
    next: {
        classes: 'next-button large-round',
        text: 'Next',
        type: 'next'
    },
    back: {
        classes: 'back-button',
        secondary: true,
        text: 'Back',
        type: 'back'
    }
};

export const defaultStepOptions: Step.StepOptions = {
    classes: 'shepherd-theme-arrows custom-default-class',
    scrollTo: true,
    cancelIcon: {
        enabled: true
    }
};

export const steps: Step.StepOptions[] = [
    {
        attachTo: {
            element: '.nav-notifications',
            on: 'top'
        },
        buttons: [builtInButtons.next],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'notifications',
        title: 'Notifications',
        text: `Be notified of friend invitations, when your friends go on rides, and when they share
        photos, etc`
    },
    {
        attachTo: {
            element: '.nav-horse-profile',
            on: 'top'
        },
        buttons: [/* builtInButtons.back, */ builtInButtons.next],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'horse-prfile',
        title: 'Horse Profile',
        text:
            'View your horses and their data. Upload their health information, evaluations, and see their ride history.'
    },
    {
        attachTo: {
            element: '.nav-map-my-ride',
            on: 'top'
        },
        buttons: [/* builtInButtons.back, */ builtInButtons.next],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'map-ride',
        title: 'Map Ride',
        text: 'Map your ride with your horse. Add photos, edit gait speed, and share with friends.'
    },
    {
        attachTo: {
            element: '.nav-tips',
            on: 'top'
        },
        buttons: [/* builtInButtons.back, */ builtInButtons.next],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'tips',
        title: 'Friends',
        text: `Share horse and rider profiles with others including trainers or other riders. View and send friend requests here!`
    },
    {
        attachTo: {
            element: '.nav-menu',
            on: 'top'
        },
        buttons: [builtInButtons.cancel],
        classes: 'custom-class-name-1 custom-class-name-2',
        id: 'nav-menu',
        title: 'Menu',
        text: `Edit your account, notification settings, and subscription status.`
    }
    /* 
    {
        buttons: [builtInButtons.cancel, builtInButtons.back],
        id: 'noAttachTo',
        title: 'Centered Modals',
        classes: 'custom-class-name-1 custom-class-name-2',
        text:
            'If no attachTo is specified, the modal will appear in the center of the screen, as per the Shepherd docs.'
    } */
];

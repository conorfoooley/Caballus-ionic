import { HorseEvaluationType, HorseMatrixType } from '../enums';

export const HORSE_CONFORMATION_MATRIX_INFO = {
  [HorseMatrixType.FrontLegsBase]: {
    images: {
      0: 'assets/images/horse-matrix/1L.png',
      5: 'assets/images/horse-matrix/1M.png',
      10: 'assets/images/horse-matrix/1H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme base narrow, 5 for ideal, 10 for extreme base wide',
    lowExtreme: 'Narrow',
    highExtreme: 'Wide'
  },
  [HorseMatrixType.FrontKneesFrontView]: {
    images: {
      0: 'assets/images/horse-matrix/2L.png',
      5: 'assets/images/horse-matrix/2M.png',
      10: 'assets/images/horse-matrix/2H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme knocked, 5 for ideal, 10 for extreme bowed',
    lowExtreme: 'Knocked',
    highExtreme: 'Bowed'
  },
  [HorseMatrixType.FrontToes]: {
    images: {
      0: 'assets/images/horse-matrix/3L.png',
      5: 'assets/images/horse-matrix/3M.png',
      10: 'assets/images/horse-matrix/3H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme narrow, 5 for ideal, 10 for extreme wide',
    lowExtreme: 'Narrow',
    highExtreme: 'Wide'
  },
  [HorseMatrixType.FrontLegsCamp]: {
    images: {
      0: 'assets/images/horse-matrix/4L.png',
      5: 'assets/images/horse-matrix/4M.png',
      10: 'assets/images/horse-matrix/4H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme under, 5 for ideal, 10 for extreme out',
    lowExtreme: 'Under',
    highExtreme: 'Out'
  },
  [HorseMatrixType.FrontKneesSideView]: {
    images: {
      0: 'assets/images/horse-matrix/5L.png',
      5: 'assets/images/horse-matrix/5M.png',
      10: 'assets/images/horse-matrix/5H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme bucked, 5 for ideal, 10 for extreme calfed',
    lowExtreme: 'Bucked',
    highExtreme: 'Calfed'
  },
  [HorseMatrixType.HindLegsStanding]: {
    images: {
      0: 'assets/images/horse-matrix/6L.png',
      5: 'assets/images/horse-matrix/6M.png',
      10: 'assets/images/horse-matrix/6H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme narrow, 5 for ideal, 10 for extreme wide',
    lowExtreme: 'Narrow',
    highExtreme: 'Wide'
  },
  [HorseMatrixType.Hocks]: {
    images: {
      0: 'assets/images/horse-matrix/7L.png',
      5: 'assets/images/horse-matrix/7M.png',
      10: 'assets/images/horse-matrix/7H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme cow-hocked, 5 for ideal, 10 for extreme bowed',
    lowExtreme: 'Cow-hocked',
    highExtreme: 'Bowed'
  },
  [HorseMatrixType.HindEnd]: {
    images: {
      0: 'assets/images/horse-matrix/8L.png',
      5: 'assets/images/horse-matrix/8M.png',
      10: 'assets/images/horse-matrix/8H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme sickle-hocked, 5 for ideal, 10 for extreme camped-out',
    lowExtreme: 'Sickle-hocked',
    highExtreme: 'Camped-Out'
  },
  [HorseMatrixType.PasternsFront]: {
    images: {
      0: 'assets/images/horse-matrix/9L.png',
      5: 'assets/images/horse-matrix/9M.png',
      10: 'assets/images/horse-matrix/9H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme upright, 5 for ideal, 10 for extreme Acute-angled',
    lowExtreme: 'Upright',
    highExtreme: 'Acute-angled'
  },
  [HorseMatrixType.PasternsHind]: {
    images: {
      0: 'assets/images/horse-matrix/10L.png',
      5: 'assets/images/horse-matrix/10M.png',
      10: 'assets/images/horse-matrix/10H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme upright, 5 for ideal, 10 for extreme Acute-angled',
    lowExtreme: 'Upright',
    highExtreme: 'Acute-angled'
  },
  [HorseMatrixType.FlightOfTraveFront]: {
    images: {
      0: 'assets/images/horse-matrix/11L.png',
      5: 'assets/images/horse-matrix/11M.png',
      10: 'assets/images/horse-matrix/11H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme paddling, 5 for ideal, 10 for extreme dishing',
    lowExtreme: 'Paddling',
    highExtreme: 'Dishing'
  },
  [HorseMatrixType.FlightOfTravelHind]: {
    images: {
      0: 'assets/images/horse-matrix/12L.png',
      5: 'assets/images/horse-matrix/12M.png',
      10: 'assets/images/horse-matrix/12H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme paddling, 5 for ideal, 10 for extreme dishing',
    lowExtreme: 'Paddling',
    highExtreme: 'Dishing'
  },
  [HorseMatrixType.BackSwayVsRoach]: {
    images: {
      0: 'assets/images/horse-matrix/13L.png',
      5: 'assets/images/horse-matrix/13M.png',
      10: 'assets/images/horse-matrix/13H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme sway, 5 for ideal, 10 for extreme roach',
    lowExtreme: 'Sway',
    highExtreme: 'Roach'
  },
  [HorseMatrixType.Chest]: {
    images: {
      0: 'assets/images/horse-matrix/14L.png',
      5: 'assets/images/horse-matrix/14M.png',
      10: 'assets/images/horse-matrix/14H.png'
    },
    descriptiveText: 'Select any value between 0 and 10. 0 for extreme narrow, 5 for ideal, 10 for extreme wide',
    lowExtreme: 'Narrow',
    highExtreme: 'Wide'
  }
};

export const HORSE_PERFORMANCE_MATRIX_INFO = {
  [HorseMatrixType.LeftSideFlexion]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.RightSideFlexion]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.ResponsivenessHoldsToBit]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.ResponsivenessRespondsToRein]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.ResponsivenessRespondsToLeg]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.ResponsivenessRespondsToSeat]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.ResponsivenessCollectionOfHorse]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsWalkToRight]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsTrotToRight]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsCanterRightLead]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsWalkToLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsTrotToLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsCanterLopeToLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsBack]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingEvenGaitsHalt]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesWalkSmallRight]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesTrotRight]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesWalkSmallLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesTrotLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesCanterLargeRight]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.MaintainingCirclesCanterLargeLeft]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedRightSidePass]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLeftSidePass]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedRightHaunchTurn]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLeftHaunchTurn]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedRightForehandTurn]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLeftForehandTurn]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedTrotOff]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLopeOffRightLead]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLopeOffLeftLead]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLeadChangeLtoR]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLeadChangeRtoL]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedLopeToHalt]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedFigure8Simple]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  },
  [HorseMatrixType.AdvancedFigure8FlyingLead]: {
    'images': {
      '0': '',
      '5': '',
      '10': ''
    },
    'descriptiveText': '',
    'lowExtreme': 'Unskilled',
    'highExtreme': 'Highly Skilled'
  }
};

export const HORSE_MATRIX_INFO = {
  [HorseEvaluationType.Conformation]: HORSE_CONFORMATION_MATRIX_INFO,
  [HorseEvaluationType.Performance]: HORSE_PERFORMANCE_MATRIX_INFO
};


export const HorseMatrixToShow = {
  [HorseEvaluationType.Conformation]: [{
    title: '',
    types: [
      HorseMatrixType.FrontLegsBase,
      HorseMatrixType.FrontKneesFrontView,
      HorseMatrixType.FrontToes,
      HorseMatrixType.FrontLegsCamp,
      HorseMatrixType.FrontKneesSideView,
      HorseMatrixType.HindLegsStanding,
      HorseMatrixType.Hocks,
      HorseMatrixType.HindEnd,
      HorseMatrixType.PasternsFront,
      HorseMatrixType.PasternsHind,
      HorseMatrixType.FlightOfTraveFront,
      HorseMatrixType.FlightOfTravelHind,
      HorseMatrixType.BackSwayVsRoach,
      HorseMatrixType.Chest
    ]
  }],
  [HorseEvaluationType.Performance]: [{
    title: 'Indicators for success',
    types: [
      HorseMatrixType.Trainability,
      HorseMatrixType.Willingness,
      HorseMatrixType.Confidence,
      HorseMatrixType.Curiosity,
      HorseMatrixType.Consistency,
      HorseMatrixType.Patience,
      HorseMatrixType.Focus,
      HorseMatrixType.Sensitivity
    ]
  }, 
  {
    title: 'Ground Work',
    types: [
      HorseMatrixType.GroundWorkCatch,
      HorseMatrixType.GroundWorkLead,
      HorseMatrixType.GroundWorkStandToSaddle,
      HorseMatrixType.GroundWorkAcceptBridle,
      HorseMatrixType.GroundWorkStandWhileMounting,
      HorseMatrixType.GroundWorkLoadInTrailer,
      HorseMatrixType.GroundWorkPickUpHandleFeet,
      HorseMatrixType.GroundWorkGroomingClipping
    ]
  }, 
  {
    title: 'General Riding',
    types: [
      HorseMatrixType.LeftSideFlexion,
      HorseMatrixType.RightSideFlexion,
      HorseMatrixType.ResponsivenessHoldsToBit,
      HorseMatrixType.ResponsivenessRespondsToRein,
      HorseMatrixType.ResponsivenessRespondsToLeg,
      HorseMatrixType.ResponsivenessRespondsToSeat,
      HorseMatrixType.ResponsivenessCollectionOfHorse,
      HorseMatrixType.MaintainingEvenGaitsWalkToRight,
      HorseMatrixType.MaintainingEvenGaitsTrotToRight,
      HorseMatrixType.MaintainingEvenGaitsCanterRightLead,
      HorseMatrixType.MaintainingEvenGaitsWalkToLeft,
      HorseMatrixType.MaintainingEvenGaitsTrotToLeft,
      HorseMatrixType.MaintainingEvenGaitsCanterLopeToLeft,
      HorseMatrixType.MaintainingEvenGaitsBack,
      HorseMatrixType.MaintainingEvenGaitsHalt,
      HorseMatrixType.MaintainingCirclesWalkSmallRight,
      HorseMatrixType.MaintainingCirclesTrotRight,
      HorseMatrixType.MaintainingCirclesCanterLargeRight,
      HorseMatrixType.MaintainingCirclesWalkSmallLeft,
      HorseMatrixType.MaintainingCirclesTrotLeft,
      HorseMatrixType.MaintainingCirclesCanterLargeLeft,
      HorseMatrixType.AdvancedRightSidePass,
      HorseMatrixType.AdvancedLeftSidePass,
      HorseMatrixType.AdvancedRightHaunchTurn,
      HorseMatrixType.AdvancedLeftHaunchTurn,
      HorseMatrixType.AdvancedRightForehandTurn,
      HorseMatrixType.AdvancedLeftForehandTurn,
      HorseMatrixType.AdvancedTrotOff,
      HorseMatrixType.AdvancedLopeOffRightLead,
      HorseMatrixType.AdvancedLopeOffLeftLead,
      HorseMatrixType.AdvancedLeadChangeLtoR,
      HorseMatrixType.AdvancedLeadChangeRtoL,
      HorseMatrixType.AdvancedLopeToHalt,
      HorseMatrixType.AdvancedFigure8Simple,
      HorseMatrixType.AdvancedFigure8FlyingLead
    ]
  }, {
    title: 'Team Roping Evaluations categories:',
    types: [
      HorseMatrixType.BoxWork,
      HorseMatrixType.RunAndRate,
      HorseMatrixType.HandlingCattle,
      HorseMatrixType.Face,
      HorseMatrixType.Stop,
      HorseMatrixType.Position
    ]
  }, {
    title: 'Calf Roping Evaluation',
    types: [
      HorseMatrixType.RunAndRate,
      HorseMatrixType.Stop,
      HorseMatrixType.WorkingRope,
      HorseMatrixType.CalfRopingBoxWork
    ]
  }, {
    title: 'Reining Evaluations',
    types: [
      HorseMatrixType.LeftCircles,
      HorseMatrixType.RightCircles,
      HorseMatrixType.LeftLeadChange,
      HorseMatrixType.RightLeadChange,
      HorseMatrixType.LeftSpin,
      HorseMatrixType.RightSpin,
      HorseMatrixType.Rollback,
      HorseMatrixType.Backup
    ]
  }, {
    title: 'Cutting Evaluations',
    types: [
      HorseMatrixType.HerdWork,
      HorseMatrixType.CowControl,
      HorseMatrixType.EyeAppeal,
      HorseMatrixType.Courage,
      HorseMatrixType.LooseRein
    ]
  }, {
    title: 'Cow Horse/Fence work Evaluation',
    types: [
      HorseMatrixType.TurnsOnFence,
      HorseMatrixType.Circling,
      HorseMatrixType.PositioningAndControl,
      HorseMatrixType.Rate
    ]
  }, {
    title: 'Barrel Racing',
    types: [
      HorseMatrixType.BarrelRacingRate,
      HorseMatrixType.BarrelRacingShoulderControl,
      HorseMatrixType.BarrelRacingHipControl,
      HorseMatrixType.BarrelRacingChangingLeads,
      HorseMatrixType.BarrelRacingRespondsToSeat
    ]
  },
  {
    title: 'Jumpers',
    types: [
      HorseMatrixType.Approach,
      HorseMatrixType.Takeoff,
      HorseMatrixType.FormOverJump,
      HorseMatrixType.Landing,
      HorseMatrixType.Recovery,
      HorseMatrixType.Adjustability,
      HorseMatrixType.Rhythm,
      HorseMatrixType.Scope
    ]
  }, {
    title: 'Hunters',
    types: [
      HorseMatrixType.Movement,
      HorseMatrixType.JumpingStyle,
      HorseMatrixType.Technique,
      HorseMatrixType.Conformation,
      HorseMatrixType.Temperament,
      HorseMatrixType.Expression,
      HorseMatrixType.WayOfGoing,
      HorseMatrixType.Presence
    ]
  }, {
    title: 'Trail',
    types: [
      HorseMatrixType.TrailObstacleNavigation,
      HorseMatrixType.TemperamentOnTrail,
      HorseMatrixType.TrailConfidence,
      HorseMatrixType.TrailRidingManners,
      HorseMatrixType.GroundManners,
      HorseMatrixType.EaseOfHandling,
      HorseMatrixType.ToleranceForNewScenarios
    ]
  }, {
    title: 'Dressage',
    types: [
      HorseMatrixType.Movement,
      HorseMatrixType.Suppleness,
      HorseMatrixType.Collection,
      HorseMatrixType.Balance,
      HorseMatrixType.Impulsion,
      HorseMatrixType.Submission,
      HorseMatrixType.Connection,
      HorseMatrixType.Harmony
    ]
  }, {
    title: '',
    types: []
  }]
};

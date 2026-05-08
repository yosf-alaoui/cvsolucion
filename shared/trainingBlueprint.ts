export type TrainingBlueprintLevelKey = "beginner" | "intermediate" | "advanced" | "final";
export type TrainingBlueprintSessionKind = "session" | "lab" | "validation";

export type TrainingBlueprintSegment = {
  label: string;
  content: string;
};

export type TrainingBlueprintSession = {
  order: number;
  levelKey: TrainingBlueprintLevelKey;
  levelLabel: string;
  sessionCode: string;
  durationLabel: string;
  durationMinutes: number;
  topic: string;
  competency: string;
  segments: TrainingBlueprintSegment[];
  outputEvidence: string;
  passCriteria: string;
  scoreLabel: string;
  decisionLabel: string;
  kind: TrainingBlueprintSessionKind;
  scoreMax: number | null;
  passThreshold: number | null;
};

export type TrainingBlueprintCriterion = {
  criterion: string;
  points: string;
  measurement: string;
};

export type TrainingBlueprintLevel = {
  key: Exclude<TrainingBlueprintLevelKey, "final">;
  label: string;
  order: number;
  hours: number;
  sessions: number;
  labs: number;
};

export const TRAINING_LEVELS: TrainingBlueprintLevel[] = [
  {
    "key": "beginner",
    "label": "Beginner",
    "order": 1,
    "hours": 6,
    "sessions": 8,
    "labs": 1
  },
  {
    "key": "intermediate",
    "label": "Intermediate",
    "order": 2,
    "hours": 9,
    "sessions": 12,
    "labs": 1
  },
  {
    "key": "advanced",
    "label": "Advanced",
    "order": 3,
    "hours": 10,
    "sessions": 14,
    "labs": 2
  }
];

export const TRAINING_RUBRIC: TrainingBlueprintCriterion[] = [
  {
    "criterion": "Workflow sequence",
    "points": "2",
    "measurement": "Correct order of operations and no skipped setup/checking steps."
  },
  {
    "criterion": "Accuracy",
    "points": "2",
    "measurement": "Dimensions, placement, selections, and properties match the brief."
  },
  {
    "criterion": "Software control",
    "points": "2",
    "measurement": "Views, commands, selections, and property areas are used correctly."
  },
  {
    "criterion": "Output quality",
    "points": "2",
    "measurement": "Saved evidence is readable, complete, and connected to the session objective."
  },
  {
    "criterion": "Independence",
    "points": "2",
    "measurement": "The trainee completes the independent task with limited trainer intervention."
  },
  {
    "criterion": "Pass threshold",
    "points": "7/10",
    "measurement": "Proceed if the output is correct and no critical workflow error remains."
  }
];

export const TRAINING_BLUEPRINT: {
  key: string;
  title: string;
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  passThreshold: number;
  levels: TrainingBlueprintLevel[];
  rubric: TrainingBlueprintCriterion[];
  sessions: TrainingBlueprintSession[];
} = {
  key: "cabinet-vision-professional-25h",
  title: "Professional Cabinet Vision Training Program",
  totalMinutes: 1500,
  totalHours: 25,
  totalSessions: 34,
  passThreshold: 7,
  levels: TRAINING_LEVELS,
  rubric: TRAINING_RUBRIC,
  sessions: [
  {
    "order": 1,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B1",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Orientation, Workstation Control, and Cabinet Vision Workflow Map",
    "competency": "Explain the complete Cabinet Vision workflow from job setup to review and identify the main interface areas without assistance.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Clean Cabinet Vision workspace, sample screenshots, and remote-access connection ready."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer maps the interface, explains navigation, object selection, views, menus, and the professional design-to-manufacture sequence."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee navigates between views, selects sample objects, identifies menus, and repeats basic screen-control actions under instruction."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee explains the workflow sequence and opens the correct work areas from memory."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A signed orientation checklist and a saved trainee screenshot showing the correct workspace.",
    "passCriteria": "The trainee names at least six interface areas, explains the workflow in order, and uses the remote workstation without control errors.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 2,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B2",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "New Job Creation and Job Properties",
    "competency": "Create a new job with correct client, room, unit, and starting project settings.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Blank job template and a one-page client/job brief supplied by the trainer."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer creates a new job, enters job data, explains why job properties affect downstream drawings, reports, and costing."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee creates a job with trainer prompts and checks each property before saving."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee creates a second job from a short brief with minimal prompting."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Two saved job files named according to the course naming standard.",
    "passCriteria": "Job name, client data, room setup, measurement units, and save location are correct; no mandatory property is missing.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 3,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B3",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Room Layout, Walls, Dimensions, Doors, and Windows",
    "competency": "Build a simple room plan with accurate walls, dimensions, and openings.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: A simple rectangular kitchen plan with wall lengths and one opening."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer draws the room, sets wall lengths, adds an opening, and verifies dimensions before adding cabinets."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee recreates the same room while the trainer corrects dimension-entry and wall-orientation mistakes."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee adds a second opening and checks the resulting plan view."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A saved room layout with walls, dimensions, and openings matching the brief.",
    "passCriteria": "Wall lengths are within tolerance, openings are placed correctly, and the trainee can explain why layout accuracy comes before cabinet placement.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 4,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B4",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Placing Standard Base, Wall, and Tall Cabinets",
    "competency": "Insert standard cabinet types and position them correctly in a simple room.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Room file from B3 and a cabinet placement brief."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer inserts base, wall, and tall cabinets, explains catalogue selection, placement behavior, alignment, and spacing."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee places the same cabinet sequence with trainer prompts and checks plan and elevation views."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee adds three additional cabinets to complete a simple run."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A saved layout containing the required base, wall, and tall cabinets.",
    "passCriteria": "Cabinets are inserted from the correct categories, aligned to the correct walls, and free from obvious overlap or spacing errors.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 5,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B5",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Basic Cabinet Editing: Size, Position, and Properties",
    "competency": "Modify cabinet dimensions and basic properties while maintaining a clean layout.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Cabinet layout from B4 with trainer-provided modification instructions."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer changes width, height, depth, position, and basic cabinet properties, explaining the difference between visual edits and property edits."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee edits selected cabinets and confirms changes in plan, elevation, and properties."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee performs a three-item modification list without step-by-step prompting."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A modified cabinet layout saved as a new revision.",
    "passCriteria": "All requested dimensions are correct, cabinet positions remain logical, and the trainee can locate the changed properties again.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 6,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B6",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Materials, Door Styles, Drawer Fronts, and Hardware Basics",
    "competency": "Apply basic materials, front styles, and hardware choices consistently across a beginner project.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Modified project from B5 and a simple finish schedule."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer applies material and front selections, explains how design choices can influence visual review and production information."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee applies finishes to assigned cabinets and verifies consistency in the model."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee corrects one intentional inconsistency introduced by the trainer."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A project with consistent basic material, door, drawer, and hardware settings.",
    "passCriteria": "Material and front choices match the finish schedule, and the trainee finds and corrects the planted inconsistency.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 7,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B7",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Plan View, Elevation, 3D Review, and Basic Presentation Check",
    "competency": "Review a beginner project visually and identify obvious modeling errors before presentation.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Beginner project from B6 with two deliberate visual issues."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer switches between plan, elevation, and 3D, demonstrates a visual checking routine, and explains presentation-quality review."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee follows the review routine, marks issues, and corrects them with support."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee produces a clean 3D or presentation view and explains what was checked."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A reviewed beginner project and a saved presentation screenshot.",
    "passCriteria": "The trainee checks all required views, identifies the deliberate issues, and exports or saves a clean review image.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 8,
    "levelKey": "beginner",
    "levelLabel": "Beginner",
    "sessionCode": "B8",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Practical Lab 1: Build a Simple Kitchen from Scratch",
    "competency": "Complete the beginner workflow under supervised remote control from job setup to visual review.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Blank workstation, one-page beginner project brief, and no prebuilt file."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer gives the assignment, explains the scoring sheet, and demonstrates only the first critical step if needed."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee controls the workstation and builds the project while the trainer intervenes only to prevent blocking errors."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes final corrections, saves the file, and presents the workflow verbally."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A complete beginner job file, visual review screenshot, and trainer score sheet.",
    "passCriteria": "The project includes correct job properties, room layout, cabinet placement, basic edits, materials, and visual review with a score of at least 7/10.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "lab",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 9,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I1",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Professional Workflow Review and Revision Discipline",
    "competency": "Apply a repeatable professional workflow and manage file revisions correctly.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Beginner lab project and revision-control naming rules."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer reviews the beginner workflow and converts it into a professional sequence with checkpoints and revision saves."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee reorganizes the previous file, creates a revision, and documents the reason for the revision."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee performs a mini-review and writes a correction log."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A correctly named revision file and a short correction log.",
    "passCriteria": "The trainee follows the defined sequence, uses correct file naming, and records corrections clearly.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 10,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I2",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Complex Room Geometry and Real-Site Conditions",
    "competency": "Create a room with multiple wall segments, obstacles, and openings from a measured brief.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Measured site brief containing wall breaks, two openings, and one obstruction."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer models non-rectangular room conditions and explains when to verify geometry before inserting cabinets."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee builds the room segment by segment and checks dimensions after each major step."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee places the obstruction and validates the room against the brief."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A realistic room shell saved as an intermediate job file.",
    "passCriteria": "Room geometry, openings, and obstruction location match the brief; the trainee catches geometry errors before cabinet insertion.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 11,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I3",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Custom Sizing and Project-Specific Cabinet Modification",
    "competency": "Modify standard cabinets to meet project-specific width, depth, height, and configuration requirements.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Intermediate room shell and cabinet modification schedule."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer modifies several standard cabinets and explains when to use standard edits versus custom project adjustments."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee modifies assigned cabinets while checking plan and elevation results."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes a short modification list and labels changes in the correction log."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A cabinet layout adapted to the project-specific schedule.",
    "passCriteria": "Cabinet sizes and basic configurations match the modification schedule, and the trainee avoids accidental changes to unrelated cabinets.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 12,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I4",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Fillers, Finished Ends, Panels, and Buildable Layout Details",
    "competency": "Add layout details that make the design buildable and visually correct.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Cabinet layout from I3 with incomplete end conditions."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer adds fillers, panels, finished ends, and explains clearance, scribe, and practical installation logic."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee completes the left side of the room with prompted decisions."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes the right side and defends each added detail."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A detailed cabinet layout with buildable end conditions.",
    "passCriteria": "Fillers, panels, and finished ends are placed logically, with no missing exposed condition in the assigned area.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 13,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I5",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Construction Options and Material Logic",
    "competency": "Connect construction and material choices to downstream outputs such as reports and cutlists.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Detailed project from I4 and a construction standard brief."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer reviews construction options and shows how choices affect project information."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee adjusts selected settings and compares the before/after impact."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee validates three cabinets against the construction standard."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A project aligned with the given construction and material logic.",
    "passCriteria": "The trainee identifies the relevant settings, applies the standard correctly, and explains at least two downstream consequences.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 14,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I6",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Reports, Cutlists, and Basic Production Output Review",
    "competency": "Generate and review basic outputs for completeness and obvious inconsistencies.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Project from I5 with required cabinets and material selections."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer generates reports or cutlist-type outputs and explains how to read them critically."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee generates outputs, checks item counts, and compares report information to the model."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee identifies one planted mismatch and records it."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Saved report/cutlist output and a completed output-review checklist.",
    "passCriteria": "The trainee produces the required output, compares it to the model, and identifies the planted mismatch.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 15,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I7",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Pricing and Bidding Logic for Designers",
    "competency": "Explain how accurate design data supports costing, estimating, and bid preparation.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Project from I6 and simplified pricing assumptions prepared by the trainer."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains the relationship between project data, materials, labor assumptions, job costing, and estimates."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee reviews selected project information and links it to the simplified estimate structure."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee lists three project errors that would distort pricing or bidding."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A short estimating-impact worksheet attached to the job folder.",
    "passCriteria": "The trainee connects model accuracy to estimating quality and identifies at least three pricing-risk errors.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 16,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I8",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Elevations, Notes, Drawing Sheets, and Client/Internal Documentation",
    "competency": "Prepare clear project documentation using views, elevations, notes, and sheet organization.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Intermediate project and documentation checklist."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer prepares elevations, checks notes, organizes views, and explains documentation clarity for client and shop communication."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee prepares the first elevation and adds or verifies required information."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee prepares a second view and performs a readability check."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A basic documentation package with views/elevations and notes.",
    "passCriteria": "Documentation is readable, views correspond to the model, notes are relevant, and missing information is recorded.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 17,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I9",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Residential Case Study: Controlled End-to-End Workflow",
    "competency": "Develop a small residential project through the correct sequence without random editing.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: New residential case-study brief with dimensions, cabinets, finishes, and documentation requirements."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer starts the case study and explains decision points, risks, and checkpoints."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee builds the first half of the project with structured trainer prompts."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes a defined project section and saves the revision."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "A partially completed residential case-study project with revision record.",
    "passCriteria": "The trainee follows the sequence, creates a usable layout, and records decisions and unresolved questions.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 18,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I10",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Troubleshooting Common Modeling and Output Issues",
    "competency": "Diagnose and correct common placement, dimension, material, and output problems.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Trainer-prepared project containing several controlled errors."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer demonstrates a diagnostic routine: view check, object check, property check, output check."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee identifies and corrects the first group of errors using the diagnostic routine."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee finds remaining errors and updates the correction log."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Corrected project file and completed troubleshooting log.",
    "passCriteria": "At least 80 percent of planted issues are found or correctly escalated, and corrections do not create new errors.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 19,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I11",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Workflow Standards, File Organization, and Quality Gate Before Advanced Work",
    "competency": "Apply naming, folder, review, and handoff standards before advanced production workflows.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Intermediate case-study project and professional handoff checklist."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer demonstrates a quality gate with folder structure, file naming, revision notes, output list, and open-issue register."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee applies the quality gate to the case-study project."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee prepares the file as if handing it to another team member."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Organized project folder, revision notes, and quality-gate checklist.",
    "passCriteria": "The handoff package is understandable to another user and contains the correct files, notes, and unresolved-item list.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 20,
    "levelKey": "intermediate",
    "levelLabel": "Intermediate",
    "sessionCode": "I12",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Practical Lab 2: Complete an Intermediate Job Section",
    "competency": "Complete a realistic job section from room setup through documentation and output review under supervision.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Intermediate practical brief and direct remote-control access."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains the assignment, timing, scoring method, and required deliverables."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee controls the workstation and completes the workflow while receiving limited coaching."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee performs final output checking, documents corrections, and presents the result."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Completed intermediate job section, documentation views, output checklist, and trainer score sheet.",
    "passCriteria": "The trainee achieves at least 7/10, with correct geometry, cabinets, materials, documentation, and basic output review.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "lab",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 21,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A1",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Advanced Production Mindset and Risk-Based Workflow",
    "competency": "Distinguish between a visually acceptable design and a production-ready Cabinet Vision job.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Completed intermediate project and production-readiness checklist."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer compares visual review with production review and explains the risks of sending unchecked data downstream."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee reviews the project using the production-readiness checklist."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee classifies issues as visual, modeling, reporting, or production risks."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Production-risk register for the training project.",
    "passCriteria": "The trainee correctly classifies at least eight issues or checks and explains their production impact.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 22,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A2",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "System Preferences, Company Standards, and Repeatable Setup",
    "competency": "Explain how settings and standards influence repeatability, reports, and production confidence.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Training database or controlled demonstration environment with example settings."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer reviews preference areas, standard assumptions, and how companies document controlled setup decisions."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee inspects selected settings and maps them to workflow effects."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee writes a short standard-setting decision note."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Settings-impact note and updated checklist.",
    "passCriteria": "The trainee explains at least three settings or standards and their effect on repeatability or output reliability.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 23,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A3",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Catalogs, Libraries, Reusable Content, and Standard Parts",
    "competency": "Use reusable content concepts to improve speed, consistency, and control.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Example catalogue/library items and a project requiring repeated elements."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer shows how reusable items, standard parts, and catalogue discipline reduce repetitive work and inconsistent modeling."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee inserts or reviews reusable content and compares it to manual modeling."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee identifies which items in the brief should become reusable standards."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Reusable-content recommendation table for the project.",
    "passCriteria": "The trainee distinguishes reusable standards from one-off project edits and justifies each recommendation.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 24,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A4",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Advanced Construction Logic and Validation",
    "competency": "Review construction choices at a deeper level and validate their impact before output.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Advanced demonstration project with varied cabinet conditions."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer inspects construction logic and explains how incorrect assumptions can affect material, assembly, and reporting."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee reviews selected cabinets against a construction standard."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee corrects or flags nonconforming construction conditions."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Construction validation checklist and corrected project revision.",
    "passCriteria": "The trainee identifies nonconforming conditions and explains whether to correct, document, or escalate them.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 25,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A5",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Object Structure, Object Tree Thinking, and Precise Selection",
    "competency": "Inspect project objects systematically and avoid uncontrolled edits.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Advanced project with nested objects and deliberate selection challenges."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains object-level thinking, object relationships, and precise selection methods for troubleshooting."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee locates specific objects and inspects their properties with support."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee resolves two selection or object-identification tasks without guessing."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Object inspection notes and corrected object-level changes.",
    "passCriteria": "The trainee selects the correct objects, avoids unintended edits, and documents what was changed and why.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 26,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A6",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Attributes and Custom Information Concepts",
    "competency": "Explain how additional object or project information supports reporting, customization, and workflow decisions.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Example project with custom information requirements."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer introduces attribute-style thinking and shows examples of information used for reports, rules, or communication."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee inspects where custom information would be useful in the workflow."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee proposes a small custom-information map for the case study."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Custom-information map with purpose, location, and expected use.",
    "passCriteria": "The trainee correctly links additional information to a report, rule, checking step, or production decision.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 27,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A7",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Rule-Based Thinking and User-Created Standards",
    "competency": "Identify where rules or standards can reduce manual work and errors.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Repetitive design scenario with recurring requirements."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains rule-based thinking and shows examples where standards reduce repeated manual edits."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee identifies repeated patterns and suggests rule or standard candidates."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee writes a before/after workflow comparison for one candidate."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Rule-candidate worksheet and workflow comparison.",
    "passCriteria": "The trainee proposes practical standards that reduce repetition without adding unnecessary complexity.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 28,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A8",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Production Outputs: Reports, Cutlists, and Reliability Checks",
    "competency": "Validate reports and cutlists using a structured production-quality method.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Advanced project and output validation checklist."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer generates outputs and demonstrates cross-checking model content against report information."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee validates selected output sections and marks questionable items."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes a reliability check for an assigned cabinet run."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Output validation checklist with pass/fail notes.",
    "passCriteria": "The trainee verifies model-to-output consistency, records uncertainties, and avoids treating reports as correct without review.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 29,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A9",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "CNC and Screen-to-Machine Workflow Concepts",
    "competency": "Explain the relationship between accurate modeling, output validation, and machine-ready production workflows.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Production workflow diagram and example model-to-machine scenario."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains screen-to-machine logic, machine-ready output concepts, and why upstream data quality controls downstream risk."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee maps model information to production consequences."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee lists risk controls before releasing data to production or machining."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Screen-to-machine risk-control checklist.",
    "passCriteria": "The trainee explains at least five upstream checks needed before machine-oriented output is trusted.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 30,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A10",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Practical Lab 3: Advanced Troubleshooting and Modification",
    "competency": "Diagnose, correct, and validate advanced modeling and output issues under live supervision.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Trainer-prepared advanced project containing controlled modeling, construction, and output issues."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer explains the problem scenario, scoring rules, and the required diagnostic order."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee controls the workstation and diagnoses the first issues with limited prompts."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee completes corrections, validates outputs, and explains remaining risks."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Corrected advanced project, troubleshooting log, validation checklist, and score sheet.",
    "passCriteria": "The trainee reaches at least 7/10 and resolves or correctly documents the majority of controlled issues.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "lab",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 31,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A11",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Complex Millwork or Commercial Case Study",
    "competency": "Break a complex cabinet or millwork requirement into manageable modeling, documentation, and validation steps.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Complex case-study brief with multiple zones, non-standard conditions, and output requirements."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer decomposes the project into zones, risk points, standards, and checkpoints."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee plans the workflow and starts one controlled section."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee defines the sequence for the remaining sections and identifies high-risk decisions."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Case-study workflow plan and first modeled section.",
    "passCriteria": "The trainee creates a logical project breakdown and identifies risks before modeling the entire job.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 32,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A12",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Templates, Repeatability, and Workflow Optimization",
    "competency": "Improve workflow speed and consistency through templates, repeatable procedures, and controlled customization.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Case-study project and workflow time-waste examples."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer shows where templates, standards, and repeatable procedures prevent rework."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee identifies inefficient steps and reorganizes one workflow segment."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee creates a workflow improvement proposal with expected benefit."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Workflow optimization proposal and updated working checklist.",
    "passCriteria": "The proposal reduces repetition, improves consistency, and does not compromise checking or production reliability.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "session",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 33,
    "levelKey": "advanced",
    "levelLabel": "Advanced",
    "sessionCode": "A13",
    "durationLabel": "45 min",
    "durationMinutes": 45,
    "topic": "Practical Lab 4: Advanced Capstone Workflow",
    "competency": "Complete a full advanced workflow from setup to documentation, output review, and final correction.",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Objective and starting file check: Capstone project brief, blank or semi-blank training environment, and final scoring rubric."
      },
      {
        "label": "5-15 min",
        "content": "Trainer demonstration: The trainer clarifies deliverables and assessment rules but does not perform the workflow for the trainee."
      },
      {
        "label": "15-30 min",
        "content": "Guided trainee execution: The trainee controls the workstation, completes the workflow, and asks targeted questions only when blocked."
      },
      {
        "label": "30-40 min",
        "content": "Independent trainee task: The trainee performs final corrections, prepares outputs, and presents the project decisions."
      },
      {
        "label": "40-45 min",
        "content": "Assessment, correction log, save evidence, and score the session."
      }
    ],
    "outputEvidence": "Final capstone job file, documentation package, output review checklist, correction log, and final score sheet.",
    "passCriteria": "The trainee achieves at least 7/10 overall and demonstrates controlled workflow, accurate modeling, documentation, output review, and professional self-checking.",
    "scoreLabel": "/10",
    "decisionLabel": "Pass or Repeat",
    "kind": "lab",
    "scoreMax": 10,
    "passThreshold": 7
  },
  {
    "order": 34,
    "levelKey": "final",
    "levelLabel": "Advanced",
    "sessionCode": "Final Validation",
    "durationLabel": "15 min",
    "durationMinutes": 15,
    "topic": "Course closing and development roadmap",
    "competency": "Confirm readiness and next steps",
    "segments": [
      {
        "label": "0-5 min",
        "content": "Review capstone score"
      },
      {
        "label": "5-15 min",
        "content": "Identify improvement priorities"
      },
      {
        "label": "15-30 min",
        "content": "Confirm practice plan"
      },
      {
        "label": "30-40 min",
        "content": "Store files"
      },
      {
        "label": "40-45 min",
        "content": "Close course"
      }
    ],
    "outputEvidence": "Final roadmap",
    "passCriteria": "All evidence saved and next steps clear",
    "scoreLabel": "",
    "decisionLabel": "",
    "kind": "validation",
    "scoreMax": null,
    "passThreshold": null
  }
],
};

const TRAINING_SESSION_MAP = new Map(TRAINING_BLUEPRINT.sessions.map((session) => [session.sessionCode, session]));

export function getTrainingSessionTemplate(sessionCode: string) {
  return TRAINING_SESSION_MAP.get(String(sessionCode || "").trim()) || null;
}

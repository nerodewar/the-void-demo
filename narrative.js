/**
 * THE VOID — NARRATIVE CONFIGURATION
 *
 * Edit story prose here without changing game events, images, routes or save logic.
 * Keep every key unchanged. Only edit the text returned after each key.
 * Use \n inside a string for a line break, or template literals (`...`) for multiline text.
 */
(() => {
  "use strict";

  function formatRebreatherTime(totalSeconds) {
    const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  const TEXT = {
    // INTRO CINEMATICS
    "intro.opening": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Elite Forces Agent Luna H. is transporting a cache of precious super-conductors from Alpha 9, a distant world beyond the stars.\n\n" +
        "It is her first solo mission through deep space.\n\n" +
        "With Earth still seventy-two hours away, Luna has crossed the last navigational threshold before home.\n\n" +
        "A silent, uncharted expanse known as The Void."),
    "intro.emergencyWake": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The fire alarm sounds, waking up Luna...\n\n" +
        "Emergency lights flood the chamber. On board, a system is on fire, though the ship reports no impact and no mechanical fault.\n\n" +
        "Still disoriented, Luna releases the sleep pod and goes to investigate."),

    // SYSTEM TRANSITIONS
    "startnewmission.missionArchiveInitialising": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Game loading..."),

    // CONTINUE / CHECKPOINT TRANSITIONS
    "continuemission.missionStateRecovered": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (checkpointText),

    // TITLE TRANSITIONS
    "quittotitle.returningToTitle": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Preserving the latest mission state"),

    // FAILURE SEQUENCE
    "showlosescreen.biologicalSignalLost": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("No further transmission received from Luna H."),

    // GAME ENTRY
    "entergame.deckCutawayOnline": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Begin the game..."),

    // ROOM NARRATIVE (all map states)
    "getroomdefinition.controlRoom": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The signal turns into static. Luna still has the specimen jar of black residue from the mess hall.\n\nThe Laboratory may be able to tell her more about it"),
    "getroomdefinition.hallway": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna moves towards the laboratory through the hallway. It is eerily quiet..."),
    "getroomdefinition.lifeSupport": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The oxygen bypass is holding. The sample may explain how it tampered with the life support systems..."),
    "getroomdefinition.southHallway": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Black smears remain on the ceiling and walls... Laboratory 07 waits at the end of the corridor under cool, blue light..."),
    "getroomdefinition.laboratory": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The Laboratory is sterile and silent. Luna locks the door behind her and places the specimen beside the molecular analysis unit.\n\nInside the jar, the residue stretches toward the scanner light."),
    "getroomdefinition.laboratory2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (`The thing has sesled the doors throughout the spacecraft... ${clocks}

The ship cannot keep Luna alive until Earth arrival. She must breach the South Hall, seize Security Control and reach the tactical oxygen supply before the reserve fails.`),
    "getroomdefinition.southHallBlastDoor": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.southHallUnlocked
            ? `The orbital key has stabilised and the blast door is open. Security Control lies beyond. ${clocks}`
            : `The South Hall door has rejected Luna's copied credentials. Its isolated maintenance processor will accept only a gravitational security key.

${clocks} Luna must reconstruct the orbital cipher and force the door before the oxygen deficit becomes irreversible.`),
    "getroomdefinition.securityControl": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (!state.securityOverrideComplete
            ? `The compact security room is intact, but every lockdown control is sealed behind a second orbital lattice. Breaking it will release the weapons lockers and restore the air supply.

${clocks}`
            : !state.cloneIncapacitated
              ? `Security operations are online. The tactical camera identifies a human figure inside Supply. It is standing between Luna and the oxygen tank, helmet, flamethrower, and plasma cells.

The imitation has completed a human form. It needs air.`
              : `Tactical Supply holds at 3.2% oxygen under stable pressure. The alien has collapsed. Security Control has released a ninety-second emergency rebreather for the retrieval.

Luna has one brief crossing to secure the real oxygen equipment.`),
    "getroomdefinition.tacticalSupply": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.tacticalGearCollected
            ? "The helmet seals and the oxygen comes on. Luna grabs fresh plasma cells, reaches for the flamethrower and checks the pressure gauge. All systems go..."
            : `The temporary hood fogs with every breath. The imitation lies there, motionless, defeated by the purge.

REBREATHER: ${formatRebreatherTime(state.rebreatherSeconds)}. Luna must open the locker and connect the proper oxygen system now.`),
    "getroomdefinition.line2738": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.actTwoComplete
            ? "The terminal has gone silent. The data shows Ground Control hasn't made contact in hours... 'So, who was that...?!' asks Luna. "
            : state.lightsRestored
              ? "The Control Room is bright again. Camera feeds populate the surveillance terminal, including archived recordings from the hours while Luna was sleeping."
              : "Every primary light aboard the ship is dead. The Control Room survives on red indicators and Luna's flashlight. Diagnostics identify one missing power relay in the lighting grid."),
    "getroomdefinition.powerJunction": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.lightsRestored
            ? "White light rolls through the corridor one fixture at a time. The grid stabilises. Whatever Luna struck with the plasma gun has retreated into the walls."
            : state.relayFound
              ? "The recovered relay is ready for installation, but wet movement is closing through the corridor. Luna must deal with the organism first."
              : "The junction reports one absent module: the main power relay. There is a replacement relay in storage
    "getroomdefinition.darkCorridor": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (!state.alienRepelled
            ? "The organism closes across the corridor before Luna can reach Storage. It feels along the walls toward her, recoiling whenever the flashlight crosses its face. She has no time to search. She must hide now or face it with the plasma gun already in her hand."
            : state.relayFound
              ? "The corridor is clear and the lighting relay is secured. The Power Junction is ready for the repair."
              : "The organism has retreated into the walls. Luna keeps the plasma gun raised and moves toward Storage to search for the lighting relay."),
    "getroomdefinition.storage": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.relayFound
            ? "The opened crates are empty. Luna has recovered the power relay and the remaining lighting-grid parts."
            : "With the alien driven back, Luna catches her breath. The relay must be in here amongst the shelves and cables."),
    "getroomdefinition.maintenanceTunnels": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.lightsOut
          ? "The tunnel lighting is dead. Luna feels can feel an eery presence this way..."
          : state.branch === "signal"
            ? "The only path to the Main Engine Room is a narrow service passage threaded through the ship's machinery."
            : state.satNavFailed
              ? "The maintenance route leads back toward Control. Navigation warnings pulse through Luna's suit as the ship drifts away from its Earth approach vector."
              : "Luna leaves the transmitter silent and moves into the maintenance access alone. The tunnels magnify every breath and every soft movement travelling through the hull."),
    "getroomdefinition.mainEngineRoom": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The engine room is in total darkness..."),
    "getroomdefinition.mainEngineRoom2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.branch === "signal"
          ? "Engine 02 grinds to a complete stop. Luna must replace the damaged regulator manually to get it running again."
          : state.satNavFailed
            ? "The engines remain stable, but the navigation alarm now dominates the room. The satellite array has stopped returning position data. The ship is flying blind."
            : "The engine assembly is intact. Luna reaches the diagnostic console and begins checking the systems before the organism can sabotage them. A warning blooms across the display: SATELLITE NAVIGATION SIGNAL LOST."),
    "getroomdefinition.airlock": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.satNavModule
          ? "Luna's suit is sealed and the replacement navigation module is clipped to her harness. Beyond the outer hatch, the ship's hull falls away into the black of The Void."
          : "The airlock service locker contains one sealed sat-nav component and an EVA tether. Luna will have to carry both outside and cross the hull to the damaged array."),
    "getroomdefinition.outerHull": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.satNavRepaired
          ? "The array is transmitting again. Luna follows the tether back toward the airlock while Earth hangs far beyond the ship, small and impossibly vulnerable."
          : "Magnetic boots lock Luna to the hull. The satellite array rises ahead, damaged panels spread against the stars. Her radio fills with interference that almost resembles breathing."),
    "getroomdefinition.satNavArray": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.satNavRepaired
          ? "The replacement locks into place. Position data floods back into the ship and the Earth-return vector stabilises. Luna is still outside, and something has disturbed the hull plating beside the array."
          : "Luna opens the navigation housing. Several contacts have been torn from their sockets rather than burned out. She braces one hand against the hull and aligns the replacement module with the exposed assembly."),
    "getroomdefinition.crewQuarters": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna emerges from sleep, the fire alarm sounding all around her.\n\nThe ship map identifies an active fire in Life Support."),
    "getroomdefinition.hallway2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.alienEncountered
          ? "The emergency lights no longer pulse in sequence. Somewhere inside the walls, a slick weight moves against the ship's direction of travel."
          : "The main hallway flashes amber. Smoke begins to drift in from the Life Support access door.\n\nThe Control Room branches away to the north. Life Support lies at the far end of the corridor."),
    "getroomdefinition.controlRoom2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The rest of the ship has vanished from the schematic. Only Control remains. Ground Control has frozen Luna's Earth approach and marked the vessel as a biological containment risk.\n\nThe relay stays open, but nobody speaks."),
    "getroomdefinition.controlRoom3": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.engineRepaired
            ? "Luna reaches Control in darkness. The crisis carrier is still open. Ground Control has received the engine telemetry and is waiting for her report."
            : "The crisis signal has left the ship. Engine 02 has failed and needs repairing manually. The Main Engine Room lies to the south via the Maintenance Tunnels."),
    "getroomdefinition.controlRoom4": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.satNavRepaired
            ? "The return vector is stable again. Ground Control has acquired the vessel's telemetry and is waiting on the relay."
            : state.satNavDiagnosed
              ? "The failed component is external. Control has loaded the repair route from the Airlock to the satellite array and released a replacement module from the EVA service locker."
              : "Navigation has stopped receiving position data. Luna must diagnose the external array before she can leave the ship."),
    "getroomdefinition.lifeSupport2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The heat is immense as Luna opens the doors to find fire has taken hold of the whole life support systems, feeding on the oxygen supply tanks.\n\nThe automatic suppression system is offline. Luna will have to put the fire out herself!"),
    "getroomdefinition.southHallway2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.alienEncountered
          ? "The corridor has gone unnaturally still. Black smears glisten along the ceiling seams, leading toward Engineering. Behind Luna, something clicks against the Kitchen door."
          : "The southern hall is unlocked. The Laboratory branches to the right. Further down are the Store Room, Kitchen and the Engineering Room. \n\n Security measures are still resolving..."),
    "getroomdefinition.laboratory3": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The sample clings to the inside of the jar as if alive. When Luna taps the glass, the residue reaches for her finger tip.\n\nThe ship's laboratory cannot identify its composition."),
    "getroomdefinition.laboratory4": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("A sticky black residue is all over the workstation... Luna cannot identify this substance.\n\n\"What the fuck...?\" Luna whispers. The residue contracts at the sound of her voice."),
    "getroomdefinition.laboratory5": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The workstation has clearly been used. One workstation is powered on, its light shining across a surface that looks wet..."),
    "getroomdefinition.kitchenMess": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.alienEncountered
          ? "The thing has withdrawn from the ceiling, leaving black strings across the metal. The door to the corridor has released. Luna can hear it moving toward Engineering."
          : "The Kitchen is empty, but it someone has been here... a cup sits in the centre of a table. One chair faces the wrong direction.\n\nThe door clicks shut behind Luna. On the counter lies another trace of sticky black residue."),
    "getroomdefinition.storeRoom": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (state.equipmentTaken
          ? "The open cases are empty. Luna has the plasma gun, flashlight and Engineering key. The creature is somewhere beyond the wall."
          : "The emergency store contains exactly what Luna needs: a plasma gun in a sealed case, a heavy flashlight and the manual access key for Engineering. She takes all three."),
    "getroomdefinition.engineering": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The Engineering door refuses Luna's biometric clearance. A physical key is required. Behind the metal, something strikes a pipe and then becomes still."),
    "getroomdefinition.unknownLocation": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The ship cannot resolve this location."),

    // MAP EXPANSION
    "movetoroom.line3605": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Reconstructing Luna's accessible route"),

    // GROUND CONTROL
    "acknowledgegroundcontrol.southernDeckUnlocked": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Expanding the ship schematic to Laboratory, Stores, Mess and Engineering"),

    // logdamage
    "logdamage.checkpoint01": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Sabotage confirmed // Mission state preserved"),

    // KITCHEN ENCOUNTER
    "inspectkitchencounter.theCounter": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The worktop is tidy but there lies another splash of black residue.\n\nBehind Luna, the room's ventilation system stops abruptly."),
    "inspectkitchencounter.itIsAboveHer": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna turns around...\n\nShe looks up.\n\nA vast black sludge with teeth hangs from the vents on the ceiling, menacingly opening its mouth as if to engorge Luna."),

    // HIDING ENCOUNTER
    "completehiding.theVoiceWithdraws": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna remains silent.\n\nThe chilling voice asks one more time. Then the organism drags itself away through the air vents.\n\nA diagnostic display wakes beside her: CREW DETECTED — 02."),
    "completehiding.checkpoint02": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Two biological signatures detected // Mission state preserved"),

    // SIGNAL BRANCH
    "startsignalbranch.theSignalLeavesTheShip": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna returns to the Control Room and opens the priority relay. She reports the sabotage, the residue and the alien organism.\n\nSuddenly, emergency warnings light up the central command unit."),
    "startsignalbranch.aSecondCrisis": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Engine 02 has failed. Ground Control tells Luna the regulator must be replaced manually."),
    "startsignalbranch.engine02RouteIsolated": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Contracting the schematic to Control, Maintenance Tunnels and Main Engine Room"),

    // ALONE BRANCH
    "startalonebranch.noSignal": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna leaves the crisis transmitter untouched. If the organism is moving through the ship, she cannot afford to announce where she is.\n\nShe opens the maintenance access and enters the tunnels alone."),
    "startalonebranch.maintenanceRouteIsolated": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Reconstructing the immediate route through Engineering"),

    // ENGINE REPAIR
    "repairengine.thrustRestored": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The new regulator seats. Engine 02 starts up abruptly, then steadies. Thrust returns to the engine."),
    "repairengine.theLightsGoOut": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Suddenly, all of the lights go out! Luna puts on her flashlight.\n\nSomething moves outside the Engine Room."),
    "repairengine.returnRouteRecalculated": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Emergency navigation active // Flashlight required"),

    // SAT-NAV FAILURE
    "triggersatnavfailure.theEnginesAreNotTheProblem": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The engines are stable. Before Luna can leave the console, the ship loses its position fix. Satellite navigation has failed and the Earth-return vector begins to drift."),
    "triggersatnavfailure.theShipIsFlyingBlind": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The schematic expands into a dangerous repair route: Engine Room, Maintenance Tunnels, Control, Airlock, Outer Hull, Satellite Array.\n\nLuna must return to Control before attempting the spacewalk."),
    "triggersatnavfailure.evaRouteConstructed": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Mapping Control, Airlock, Outer Hull and Satellite Navigation Array"),

    // SAT-NAV DIAGNOSIS
    "diagnosesatnav.theRepairIsOutside": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Control isolates the fault to an external navigation module. A replacement is stored inside Airlock 02.\n\nLuna will have to suit up, cross the outer hull and install it by hand."),
    "diagnosesatnav.airlock02Unlocked": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Preparing the exterior repair schematic"),

    // SAT-NAV REPAIR
    "repairsatnav.positionFixRestored": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna drives the replacement module into the exposed assembly and locks it in place. The array wakes beneath her hand. Earth-return coordinates stream back into the ship.\n\nThe navigation failure is resolved. Now she has to get back inside."),
    "repairsatnav.returnRouteLoading": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Reconstructing the path to Airlock 02 and Control"),

    // BLACKOUT
    "beginblackoutact.checkpoint03": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Shipwide lighting failure // Reconstructing emergency search grid"),

    // POWER RELAY
    "findrelay.powerRelayRecovered": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna finds the relay secured beneath a storage crate.\n\nA heavy impact sounds once in the corridor outside."),

    // BLACKOUT HIDING ENCOUNTER
    "hideandfailblackout.itHeardHer": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna turns off her flashlight. The corridor becomes completely dark..."),
    "hideandfailblackout.found": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The thing lunges for Luna, it's sticky black tenticles clawing at her violently!\n\nLuna is frightened, but she is not helpless."),
    "hideandfailblackout.counterattack": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna pulls out her plasma gun and blasts the alien backwards into the darkness!"),

    // BLACKOUT CONFRONTATION
    "facealienblackout.faceIt": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna plants her boots, raises the plasma gun and fires. The blast tears through the organism's outer shape and throws it backward into the conduits. Its scream travels through every speaker on the deck."),
    "facealienblackout.restoreTheGrid": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("With the corridor clear, Luna locks the recovered relay into the empty housing and routes power through the emergency bus."),
    "facealienblackout.theLightsReturn": ({ state = {}, clocks = "", checkpointText = "" } = {}) => (" White light floods the corridor. The damaged organism retreats into the walls.\n\nLuna returns to the communications station in Control."),
    "facealienblackout.controlRoomRestored": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Returning Luna to the communications station"),

    // restartblackoutcheckpoint
    "restartblackoutcheckpoint.checkpoint03": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Restoring the lighting-failure mission state"),

    // SURVEILLANCE ARCHIVE
    "opensurveillance.twentyFourCamerasOnline": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Several recordings were classified as ordinary crew movement, even though Luna is the only registered crew member aboard."),
    "opensurveillance.unregisteredMovement": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("A dark figure crosses Corridor B-12. One side carries Luna's posture and gait. The other drags behind it as liquid shadow."),
    "opensurveillance.crewIdentitiesDetected2": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The earlier recording is unmistakable. An uncanny figure looking almost exactly like Luna walks through Engineering..."),

    // FALSE GROUND CONTROL
    "runfalsegroundsequence.groundControl": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The channel opens without the expected transmission delay.\n\n'Agent Luna H. Resume Earth approach immediately. Do not alter the landing corridor. Bring the vessel home.'"),
    "runfalsegroundsequence.welcomeHomeLuna": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The voice repeats fragments of old messages, then fractures into wet groans, clicks and impossible harmonics.\n\n'THE SHIP MUST ARRIVE. WE MUST ARRIVE. BRING THE SHIP TO EARTH.'\n\nGround Control is gone. The organism is speaking through the ship."),
    "runfalsegroundsequence.checkpoint04": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Internal communications compromised // Mission state preserved"),

    // completesecurityoverride
    "completesecurityoverride.someoneIsAlreadyInside": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The tactical locks release, but the camera feed stops Luna cold. A woman stands inside Supply wearing her proportions, her posture and her face. The system identifies both figures as Luna H.\n\nThe imitation is blocking the oxygen equipment and weapons. Its completed human body is breathing ship air."),

    // showclonesurveillance
    "showclonesurveillance.biometricDuplicate": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The figure remains almost perfectly still. The chest rises and falls. The completed human form requires oxygen, exactly as the Laboratory predicted."),

    // completeatmosphericoverride
    "completeatmosphericoverride.theHumanFormCollapses": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Oxygen drains from the compartment while inert gas holds the pressure. The copied body staggers, reaches for the locked tactical case and falls. Its lungs have failed.\n\nSecurity releases one emergency rebreather: ninety seconds of air for Luna to cross the purged room and reach the proper helmet and tank."),

    // collecttacticalloadout
    "collecttacticalloadout.lunaCanBreathe": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The helmet locks against Luna's suit and the tank valve opens. Clean oxygen floods the mask. She loads fresh plasma cells and takes the flamethrower from its rack.\n\nThe ship has less than twenty-three hours of breathable reserve left, but Luna is no longer helpless inside it."),

    // showtacticalloadout
    "showtacticalloadout.loadoutSecured": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Tactical helmet sealed. Oxygen tank online. Flamethrower acquired. Plasma ammunition replenished. Luna is ready to take the hunt back into the ship."),

    // LABORATORY ANALYSIS MONTAGE
    "runlaboratorymontage.returnToTheLaboratory": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Luna locks the Laboratory door behind her and sets the sealed specimen beside the molecular chamber. The residue moves beneath the glass, recoiling from the light and then reaching toward it again."),
    "runlaboratorymontage.loadResidueSample": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The chamber locks around the tube. Black material spreads over the inner glass and presses toward Luna's gloved hand. She withdraws it and initiates the scan."),
    "runlaboratorymontage.unknownBiologicalMaterial": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The sample contains no stable cellular structure. Its molecules dismantle and rebuild themselves in response to the scanner. It is not merely alive. It is searching for a biological pattern.\n\nLuna: ‘You're trying to become something.’"),
    "runlaboratorymontage.adaptiveDnaMimicry": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The organism has no fixed genome. It absorbs biological information and reconstructs itself from acquired DNA. The simulated strands begin aligning with a human sequence.\n\nLuna: ‘It can copy living things.’"),
    "runlaboratorymontage.itStudiedHer": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The residue has incorporated fragments of Luna's DNA. It has not merely touched her. It has studied her. The ship marks the potential completed sequence as human.\n\nLuna: ‘Even people.’"),
    "runlaboratorymontage.howItCameAboard": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Trace minerals in the organism match the Alpha 9 extraction site. Dormant biological matter was concealed inside the recovered cores"),
    "runlaboratorymontage.theFormBecomesPermanent": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("As the alien mimicks the DNA of the host, it becomes locked into its new form, essentially becoming human.\n\nTransformation is irreversible."),
    "runlaboratorymontage.itCanDie": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("A completed human form requires oxygen. It develops circulation, permanent tissue and a heart. It can suffocate. It can bleed. It can die.\n\nLuna: ‘Once it becomes human, it becomes mortal.’"),
    "runlaboratorymontage.emergencyLockdown": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("The scanner freezes. Every Laboratory light dies, then turns red. Reinforced doors seal throughout the ship. The Security Armoury, tactical equipment bay and emergency weapons lockers disappear behind locked doors."),

    // FINAL REPORT
    "finalisebranch.commandNodeIsolated": ({ state = {}, clocks = "", checkpointText = "" } = {}) => ("Closing secondary routes and acquiring the Earth relay"),

  };

  function get(key, context = {}) {
    const entry = TEXT[key];
    if (entry === undefined) {
      console.warn(`[The Void] Narrative key not found: ${key}`);
      return "";
    }
    return typeof entry === "function" ? entry(context) : entry;
  }

  window.VoidNarrative = Object.freeze({ TEXT, get });
})();

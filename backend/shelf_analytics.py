# ============================================================
# RETAILEDGE AI — SHELF ANALYTICS + EVENT ENGINE
# ============================================================

from datetime import datetime


class ShelfAnalytics:

    def __init__(self, shelf_id="SHELF_01"):

        self.shelf_id = shelf_id

        # Current shelf state
        self.bottle_count = 0
        self.stock_status = "UNKNOWN"

        # Misplaced objects
        self.misplaced_objects = []

        # Confidence
        self.average_confidence = 0.0

        # Last event
        self.last_event = None

        # Event history
        self.event_history = []

        # Previous states
        self.previous_bottle_count = 0
        self.previous_stock_status = "UNKNOWN"
        self.previous_misplaced_objects = []


    # ========================================================
    # UPDATE ANALYTICS
    # ========================================================

    def update(
        self,
        bottle_count,
        misplaced_objects,
        confidences
    ):

        # ----------------------------------------------------
        # Save previous state
        # ----------------------------------------------------

        self.previous_bottle_count = (
            self.bottle_count
        )

        self.previous_stock_status = (
            self.stock_status
        )

        self.previous_misplaced_objects = (
            self.misplaced_objects.copy()
        )


        # ----------------------------------------------------
        # Current bottle count
        # ----------------------------------------------------

        self.bottle_count = bottle_count


        # ----------------------------------------------------
        # Stock status
        # ----------------------------------------------------

        if bottle_count > 0:

            self.stock_status = "AVAILABLE"

        else:

            self.stock_status = "OUT_OF_STOCK"


        # ----------------------------------------------------
        # Misplaced objects
        # ----------------------------------------------------

        self.misplaced_objects = []

        for obj in misplaced_objects:

            name = obj["name"]

            if name not in self.misplaced_objects:

                self.misplaced_objects.append(
                    name
                )


        # ----------------------------------------------------
        # Average confidence
        # ----------------------------------------------------

        if confidences:

            self.average_confidence = (
                sum(confidences)
                /
                len(confidences)
            )

        else:

            self.average_confidence = 0.0


        # ----------------------------------------------------
        # Detect events
        # ----------------------------------------------------

        self.detect_events()


    # ========================================================
    # EVENT ENGINE
    # ========================================================

    def detect_events(self):

        # ----------------------------------------------------
        # STOCKOUT EVENT
        # ----------------------------------------------------

        if (
            self.stock_status == "OUT_OF_STOCK"
            and
            self.previous_stock_status != "OUT_OF_STOCK"
        ):

            self.create_event(
                "STOCKOUT",
                "Shelf is out of stock",
                "HIGH"
            )


        # ----------------------------------------------------
        # RESTOCK EVENT
        # ----------------------------------------------------

        if (
            self.stock_status == "AVAILABLE"
            and
            self.previous_stock_status == "OUT_OF_STOCK"
        ):

            self.create_event(
                "RESTOCKED",
                "Shelf stock detected again",
                "INFO"
            )


        # ----------------------------------------------------
        # MISPLACED OBJECT
        # ----------------------------------------------------

        new_objects = []

        for obj in self.misplaced_objects:

            if obj not in self.previous_misplaced_objects:

                new_objects.append(obj)


        for obj in new_objects:

            self.create_event(
                "MISPLACED_OBJECT",
                f"{obj} detected on shelf",
                "MEDIUM"
            )


        # ----------------------------------------------------
        # OBJECT REMOVED
        # ----------------------------------------------------

        removed_objects = []

        for obj in self.previous_misplaced_objects:

            if obj not in self.misplaced_objects:

                removed_objects.append(obj)


        for obj in removed_objects:

            self.create_event(
                "OBJECT_REMOVED",
                f"{obj} removed from shelf",
                "INFO"
            )


    # ========================================================
    # CREATE EVENT
    # ========================================================

    def create_event(
        self,
        event_type,
        message,
        priority
    ):

        event = {

            "event_type": event_type,

            "shelf_id": self.shelf_id,

            "message": message,

            "priority": priority,

            "timestamp": datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

        }


        # Save latest event

        self.last_event = event


        # Add to history

        self.event_history.append(
            event
        )


        # Keep only latest 100 events

        if len(self.event_history) > 100:

            self.event_history = (
                self.event_history[-100:]
            )


        # Terminal output

        print()
        print("================================")
        print(" RETAILEDGE EVENT")
        print("================================")
        print(
            f"Type     : {event_type}"
        )
        print(
            f"Shelf    : {self.shelf_id}"
        )
        print(
            f"Priority : {priority}"
        )
        print(
            f"Message  : {message}"
        )
        print(
            f"Time     : {event['timestamp']}"
        )
        print("================================")
        print()


    # ========================================================
    # GET CURRENT ANALYTICS
    # ========================================================

    def get_data(self):

        return {

            "shelf_id": self.shelf_id,

            "bottle_count": self.bottle_count,

            "stock_status": self.stock_status,

            "misplaced_objects":
                self.misplaced_objects,

            "misplaced_count":
                len(self.misplaced_objects),

            "average_confidence":
                round(
                    self.average_confidence * 100,
                    1
                ),

            "last_event":
                self.last_event,

            "timestamp":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }


    # ========================================================
    # GET EVENT HISTORY
    # ========================================================

    def get_events(self):

        return self.event_history


# ============================================================
# TEST THE ANALYTICS ENGINE
# ============================================================

if __name__ == "__main__":

    print()
    print("======================================")
    print(" RETAILEDGE SHELF ANALYTICS TEST")
    print("======================================")
    print()


    analytics = ShelfAnalytics(
        "SHELF_01"
    )


    # --------------------------------------------------------
    # TEST 1 — Bottles detected
    # --------------------------------------------------------

    print("TEST 1: Bottles detected")

    analytics.update(

        bottle_count=3,

        misplaced_objects=[],

        confidences=[
            0.91,
            0.87,
            0.94
        ]

    )

    print(
        analytics.get_data()
    )


    # --------------------------------------------------------
    # TEST 2 — Cup appears
    # --------------------------------------------------------

    print()
    print("TEST 2: Cup appears")

    analytics.update(

        bottle_count=3,

        misplaced_objects=[
            {
                "name": "cup"
            }
        ],

        confidences=[
            0.91,
            0.87,
            0.94
        ]

    )

    print(
        analytics.get_data()
    )


    # --------------------------------------------------------
    # TEST 3 — Stockout
    # --------------------------------------------------------

    print()
    print("TEST 3: Bottles disappear")

    analytics.update(

        bottle_count=0,

        misplaced_objects=[],

        confidences=[]

    )

    print(
        analytics.get_data()
    )


    # --------------------------------------------------------
    # TEST 4 — Restocked
    # --------------------------------------------------------

    print()
    print("TEST 4: Bottles return")

    analytics.update(

        bottle_count=4,

        misplaced_objects=[],

        confidences=[
            0.89,
            0.92,
            0.90,
            0.88
        ]

    )

    print(
        analytics.get_data()
    )


    # --------------------------------------------------------
    # EVENTS
    # --------------------------------------------------------

    print()
    print("EVENT HISTORY")
    print("--------------------------------")

    for event in analytics.get_events():

        print(event)
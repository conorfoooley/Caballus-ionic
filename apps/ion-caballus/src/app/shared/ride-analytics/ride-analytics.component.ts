import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from "@angular/core";
import {
  kilometersToMiles,
  metersToFeet,
  MINUTES_PER_HOUR,
  MS_PER_SECOND,
  Ride,
  RideCategory,
  SECONDS_PER_MINUTE,
  wayPointPairStats
} from "@caballus/ui-common";
import { ChartConfiguration, ChartOptions } from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { BehaviorSubject } from "rxjs";

const speedAxisRGBAColor = "54, 162, 235";
const elevationAxisRGBAColor = "83, 83, 83";

@Component({
  selector: "app-ride-analytics",
  templateUrl: "./ride-analytics.component.html",
  styleUrls: ["./ride-analytics.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RideAnalyticsComponent implements OnChanges {
  @Input() public ride: Ride;

  public RideCategory: typeof RideCategory = RideCategory;

  public lineChartData: ChartConfiguration["data"] = {
    datasets: [
      {
        data: [],
        label: "Speed",
        yAxisID: "x1",
        backgroundColor: `rgba(${speedAxisRGBAColor}, 0.2)`,
        borderColor: `rgba(${speedAxisRGBAColor}, 0.8)`,
        pointBackgroundColor: `rgba(${speedAxisRGBAColor}, 1)`,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: `rgba(${speedAxisRGBAColor}, 0.8)`,
        fill: "origin",
        tension: 0.2
      },
      {
        data: [],
        label: "Elevation",
        yAxisID: "y",
        backgroundColor: `rgba(${elevationAxisRGBAColor}, 0.3)`,
        borderColor: `rgba(${elevationAxisRGBAColor}, 0.8)`,
        pointBackgroundColor: `rgba(${elevationAxisRGBAColor}, 1)`,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: `rgba(${elevationAxisRGBAColor}, 0.8)`,
        fill: "origin",
        tension: 0.2
      }
    ]
  };
  public speed$: BehaviorSubject<{
    avgSpeed: number;
    maxSpeed: number;
  }> = new BehaviorSubject({
    avgSpeed: 0,
    maxSpeed: 0
  });

  // I don't know what exactly is causing it but for some reason there's a
  // line of code in Chart.js (internal backing library for ng2-charts) that
  // throws a NS_ERROR_FAILURE in Firefox.
  //
  // It seems specific to a line that just sets the font property on a canvas
  // so I don't know what is going on there. It seems to be a benign error
  // though so I'll just leave it for now.
  public lineChartOptions: ChartOptions = {
    elements: {
      point: {
        radius: 0
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (toolTip) => `${toolTip[0].label}M`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: false,
        type: "linear",
        ticks: {
          autoSkip: true,
          autoSkipPadding: 1,
          minRotation: 30,
          maxTicksLimit: 10,
          callback: (value) => `${(value as number).toFixed(2)}M`
        },
        grid: {
          display: false
        }
      },
      y: {
        position: "right",
        grid: {
          display: false
        },
        ticks: {
          color: `rgba(${elevationAxisRGBAColor}, 0.8)`,
          callback: (value) => parseInt(value as string),
          stepSize: 10
        }
      },
      x1: {
        position: "left",
        grid: {
          display: false
        },
        ticks: {
          color: `rgba(${speedAxisRGBAColor}, 0.8)`
        }
      }
    }
  };
  public lineChartLegend: boolean = false;
  @ViewChild(BaseChartDirective, { static: true })
  public chart: BaseChartDirective;

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.ride.currentValue) {
      this._getRideDetail();
    }
  }

  private _getRideDetail(): void {
    const ride = { ...this.ride };

    const speedPoints = [];
    const altitudePoints = [];

    for (let i = 0; i < ride.paths.length; i++) {
      const { wayPoints } = ride.paths[i];
      let currentX = 0;
      for (let j = 1; j < wayPoints.length; j++) {
        // calculations for the X axis
        const diffInMs = new Date(wayPoints[j].timestamp).getTime() - new Date(wayPoints[0].timestamp).getTime();
        const diffInMinutes = diffInMs / MS_PER_SECOND / SECONDS_PER_MINUTE;
        const xAxes = Math.floor(diffInMinutes) + 1;

        if (xAxes !== currentX) {
          // calculations for the Y axis
          const { metrics } = ride.calculatedGaitKilometers[0];
          const pairStats = wayPointPairStats(wayPoints[j - 1], wayPoints[j], metrics);

          speedPoints.push({
            x: xAxes,
            y:
              kilometersToMiles(pairStats.kilometers) /
              (pairStats.millisec /
                (MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR))
          });
          altitudePoints.push({
            x: xAxes,
            y: metersToFeet(wayPoints[j].altitude)
          });
          currentX = xAxes;
        }
      }
    }

    this.lineChartData.datasets[0].data = [...speedPoints];
    this.lineChartData.datasets[1].data = [...altitudePoints];

    // hide Ride elevation when ride category is arena
    if (ride.category === RideCategory.Arena) {
      (this.lineChartOptions.scales as any).y.display = false;
      this.lineChartData.datasets[1].hidden = true;
    }

    this._calculateAveAndMaxSpeed(speedPoints);
    this.chart.update();
  }

  private _calculateAveAndMaxSpeed(
    speedPoints: { x: number; y: number }[]
  ): void {
    const speed = speedPoints;
    let maxSpeed = 0;
    const avgSpeed =
      speed.reduce((a, { y }) => {
        if (y > maxSpeed) {
          maxSpeed = y;
        }
        return a + y;
      }, 0) / speedPoints.length;
    this.speed$.next({
      avgSpeed,
      maxSpeed
    });
  }
}

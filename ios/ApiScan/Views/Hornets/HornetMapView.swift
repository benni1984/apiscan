import SwiftUI
import MapKit

struct HornetMapView: View {
    @EnvironmentObject var vm: HornetViewModel

    var body: some View {
        Group {
            if vm.isLoading && vm.nests == nil {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let geoJSON = vm.nests {
                MapContent(features: geoJSON.features)
            } else {
                ContentUnavailableView(
                    NSLocalizedString("hornets.map.noNests", comment: ""),
                    systemImage: "map",
                    description: Text(NSLocalizedString("hornets.map.hint", comment: ""))
                )
            }
        }
        .task { await vm.loadNests() }
    }
}

private struct MapContent: View {
    let features: [HornetNestFeature]

    @State private var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.0, longitude: 2.0),
            span: MKCoordinateSpan(latitudeDelta: 8, longitudeDelta: 8)
        )
    )

    var body: some View {
        Map(position: $position) {
            ForEach(features, id: \.properties.id) { feature in
                let coord = CLLocationCoordinate2D(
                    latitude: feature.geometry.coordinates[1],
                    longitude: feature.geometry.coordinates[0]
                )
                Annotation(
                    feature.properties.notes ?? feature.properties.status,
                    coordinate: coord
                ) {
                    NestPin(status: feature.properties.status)
                }
            }
        }
        .overlay(alignment: .bottomLeading) {
            MapLegend()
                .padding(12)
        }
    }
}

private struct NestPin: View {
    let status: String

    var color: Color {
        switch status {
        case "destruction_ordered": return .yellow
        case "destroyed":           return .green
        default:                    return .red
        }
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 20, height: 20)
            Image(systemName: "ant.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 10, height: 10)
                .foregroundColor(.white)
        }
    }
}

private struct MapLegend: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            LegendRow(color: .red,    label: NSLocalizedString("hornets.map.status.found", comment: ""))
            LegendRow(color: .yellow, label: NSLocalizedString("hornets.map.status.ordered", comment: ""))
            LegendRow(color: .green,  label: NSLocalizedString("hornets.map.status.destroyed", comment: ""))
        }
        .padding(10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
    }
}

private struct LegendRow: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 12, height: 12)
            Text(label).font(.caption)
        }
    }
}

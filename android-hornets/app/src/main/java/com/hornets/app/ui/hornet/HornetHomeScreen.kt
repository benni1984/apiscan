package com.hornets.app.ui.hornet

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hornets.app.R
import com.hornets.app.di.AppModule

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HornetHomeScreen(
    vm: HornetViewModel = viewModel { HornetViewModel(AppModule.repository) }
) {
    val tabs = listOf(
        stringResource(R.string.hornet_tab_info),
        stringResource(R.string.hornet_tab_map),
        stringResource(R.string.hornet_tab_report),
        stringResource(R.string.hornet_tab_community)
    )
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(title = { Text(stringResource(R.string.hornet_title)) })
                TabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { index, label ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(label) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (selectedTab) {
                0 -> HornetInfoContent(vm = vm)
                1 -> HornetMapContent(vm = vm)
                2 -> HornetReportContent(vm = vm)
                3 -> HornetCommunityContent(vm = vm)
            }
        }
    }
}

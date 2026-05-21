package com.apiscan.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Hive
import androidx.compose.material.icons.filled.PestControl
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.ui.navigation.ApiScanNavGraph
import com.apiscan.app.ui.navigation.Routes
import com.apiscan.app.ui.theme.ApiScanTheme
import com.apiscan.app.R
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var tokenStore: TokenStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ApiScanTheme {
                val navController = rememberNavController()
                val backStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = backStackEntry?.destination?.route ?: ""
                val isHornetSection = currentRoute.startsWith("hornet")

                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            NavigationBarItem(
                                selected = !isHornetSection,
                                onClick = {
                                    val dest = if (tokenStore.isLoggedIn) Routes.APIARY_LIST else Routes.LOGIN
                                    navController.navigate(dest) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon = { Icon(Icons.Default.Hive, contentDescription = null) },
                                label = { Text("ApiScan") }
                            )
                            NavigationBarItem(
                                selected = isHornetSection,
                                onClick = {
                                    navController.navigate(Routes.HORNET_HOME) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon = { Icon(Icons.Default.PestControl, contentDescription = null) },
                                label = { Text(stringResource(R.string.tab_hornets)) }
                            )
                        }
                    }
                ) { innerPadding ->
                    ApiScanNavGraph(
                        navController = navController,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

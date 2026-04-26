package com.apiscan.app.ui.navigation

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.*
import androidx.navigation.compose.*
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.ui.apiaries.*
import com.apiscan.app.ui.auth.*
import com.apiscan.app.ui.hives.*
import com.apiscan.app.ui.inspections.*
import com.apiscan.app.ui.qr.*
import com.apiscan.app.ui.settings.SettingsScreen
import com.apiscan.app.ui.stats.HiveStatsScreen
import javax.inject.Inject

object Routes {
    const val LOGIN              = "login"
    const val REGISTER           = "register"
    const val APIARY_LIST        = "apiary_list"
    const val APIARY_DETAIL      = "apiary_detail/{apiaryId}"
    const val APIARY_FORM        = "apiary_form?apiaryId={apiaryId}"
    const val HIVE_DETAIL        = "hive_detail/{hiveId}"
    const val HIVE_INITIALIZE    = "hive_initialize/{qrToken}"
    const val INSPECTION_FORM    = "inspection_form/{hiveId}?inspectionId={inspectionId}"
    const val INSPECTION_DETAIL  = "inspection_detail/{inspectionId}/{hiveId}"
    const val HIVE_STATS         = "hive_stats/{hiveId}"
    const val QR_SCAN            = "qr_scan"
    const val QR_BATCH_LIST      = "qr_batch_list"
    const val QR_BATCH_DETAIL    = "qr_batch_detail/{batchId}"
    const val SETTINGS           = "settings"
}

@Composable
fun ApiScanNavGraph(tokenStore: TokenStore = androidx.hilt.android.EntryPointAccessors
    .fromApplication(
        androidx.compose.ui.platform.LocalContext.current.applicationContext,
        TokenStoreEntryPoint::class.java
    ).tokenStore()
) {
    val navController = rememberNavController()
    val start = if (tokenStore.isLoggedIn) Routes.APIARY_LIST else Routes.LOGIN

    NavHost(navController, startDestination = start) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess  = { navController.navigate(Routes.APIARY_LIST) { popUpTo(Routes.LOGIN) { inclusive = true } } },
                onNavigateRegister = { navController.navigate(Routes.REGISTER) }
            )
        }
        composable(Routes.REGISTER) {
            RegisterScreen(
                onSuccess = { navController.navigate(Routes.APIARY_LIST) { popUpTo(Routes.LOGIN) { inclusive = true } } },
                onBack    = { navController.popBackStack() }
            )
        }
        composable(Routes.APIARY_LIST) {
            ApiaryListScreen(
                onApiaryClick = { id -> navController.navigate("apiary_detail/$id") },
                onScanClick   = { navController.navigate(Routes.QR_SCAN) },
                onBatchClick  = { navController.navigate(Routes.QR_BATCH_LIST) },
                onSettingsClick = { navController.navigate(Routes.SETTINGS) }
            )
        }
        composable(Routes.APIARY_DETAIL,
            arguments = listOf(navArgument("apiaryId") { type = NavType.StringType })) { back ->
            ApiaryDetailScreen(
                apiaryId = back.arguments!!.getString("apiaryId")!!,
                onHiveClick = { id -> navController.navigate("hive_detail/$id") },
                onBack      = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_DETAIL,
            arguments = listOf(navArgument("hiveId") { type = NavType.StringType })) { back ->
            HiveDetailScreen(
                hiveId = back.arguments!!.getString("hiveId")!!,
                onInspectionClick = { inspId, hiveId -> navController.navigate("inspection_detail/$inspId/$hiveId") },
                onAddInspection   = { hiveId -> navController.navigate("inspection_form/$hiveId?inspectionId=") },
                onStatsClick      = { hiveId -> navController.navigate("hive_stats/$hiveId") },
                onBack            = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_INITIALIZE,
            arguments = listOf(navArgument("qrToken") { type = NavType.StringType })) { back ->
            HiveInitializeScreen(
                qrToken  = back.arguments!!.getString("qrToken")!!,
                onSuccess = { hiveId -> navController.navigate("hive_detail/$hiveId") { popUpTo(Routes.QR_SCAN) } },
                onBack    = { navController.popBackStack() }
            )
        }
        composable(Routes.INSPECTION_FORM,
            arguments = listOf(
                navArgument("hiveId")       { type = NavType.StringType },
                navArgument("inspectionId") { type = NavType.StringType; defaultValue = "" }
            )
        ) { back ->
            InspectionFormScreen(
                hiveId       = back.arguments!!.getString("hiveId")!!,
                inspectionId = back.arguments!!.getString("inspectionId")!!.ifEmpty { null },
                onSaved = { navController.popBackStack() },
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.INSPECTION_DETAIL,
            arguments = listOf(
                navArgument("inspectionId") { type = NavType.StringType },
                navArgument("hiveId")       { type = NavType.StringType }
            )
        ) { back ->
            InspectionDetailScreen(
                inspectionId = back.arguments!!.getString("inspectionId")!!,
                hiveId       = back.arguments!!.getString("hiveId")!!,
                onEdit  = { inspId, hiveId -> navController.navigate("inspection_form/$hiveId?inspectionId=$inspId") },
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_STATS,
            arguments = listOf(navArgument("hiveId") { type = NavType.StringType })) { back ->
            HiveStatsScreen(
                hiveId = back.arguments!!.getString("hiveId")!!,
                onBack = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_SCAN) {
            QRScanScreen(
                onHiveFound     = { hiveId -> navController.navigate("hive_detail/$hiveId") { popUpTo(Routes.QR_SCAN) } },
                onUnlinked      = { token  -> navController.navigate("hive_initialize/$token") },
                onBack          = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_BATCH_LIST) {
            QRBatchListScreen(
                onBatchClick = { id -> navController.navigate("qr_batch_detail/$id") },
                onBack       = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_BATCH_DETAIL,
            arguments = listOf(navArgument("batchId") { type = NavType.StringType })) { back ->
            QRBatchDetailScreen(
                batchId = back.arguments!!.getString("batchId")!!,
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(
                onLogout = { navController.navigate(Routes.LOGIN) { popUpTo(0) { inclusive = true } } },
                onBack   = { navController.popBackStack() }
            )
        }
    }
}

@dagger.hilt.EntryPoint
@dagger.hilt.InstallIn(dagger.hilt.components.SingletonComponent::class)
interface TokenStoreEntryPoint {
    fun tokenStore(): TokenStore
}

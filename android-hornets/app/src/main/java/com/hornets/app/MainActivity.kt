package com.hornets.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.hornets.app.ui.hornet.HornetHomeScreen
import com.hornets.app.ui.theme.HornetTrackerTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HornetTrackerTheme {
                HornetHomeScreen()
            }
        }
    }
}

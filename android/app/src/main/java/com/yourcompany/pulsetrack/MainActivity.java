
package com.yourcompany.pulsetrack;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the Samsung Health plugin
        registerPlugin(SamsungHealthPlugin.class);
    }
}

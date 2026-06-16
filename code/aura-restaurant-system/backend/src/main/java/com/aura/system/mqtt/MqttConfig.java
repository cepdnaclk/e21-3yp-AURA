package com.aura.system.mqtt;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.IntegrationComponentScan;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.channel.PublishSubscribeChannel;
import org.springframework.integration.config.EnableIntegration;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.integration.channel.PublishSubscribeChannel;


import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
@EnableIntegration   //  ADDED — activates Spring Integration channels
@IntegrationComponentScan
public class MqttConfig {

    private static final String BROKER_URL = "tcp://mosquitto:1883";
    private static final String CLIENT_ID_IN  = "aura-server-inbound";
    private static final String CLIENT_ID_OUT = "aura-server-outbound";

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); 
        return mapper;
    }

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{BROKER_URL});
        options.setCleanSession(true);
        options.setAutomaticReconnect(true);
        factory.setConnectionOptions(options);
        return factory;
    }


    @Bean
    public MessageChannel mqttInputChannel() {
        return new PublishSubscribeChannel();
    }

    @Bean
    public MqttPahoMessageDrivenChannelAdapter inboundAdapter(
            MqttPahoClientFactory mqttClientFactory) {

        MqttPahoMessageDrivenChannelAdapter adapter =
            new MqttPahoMessageDrivenChannelAdapter(
                CLIENT_ID_IN,
                mqttClientFactory,
                "aura/robot/login",
                "aura/table/+/menu",
                "aura/table/+/order",
                "aura/kitchen/+/order",
                "aura/table/+/payment",
                "aura/table/+/reservation",
                "aura/robot/+",
                "aura/robot/+/status"
            );

        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    @Bean
    public MessageChannel mqttOutputChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutputChannel")
    public MessageHandler mqttOutboundHandler(MqttPahoClientFactory mqttClientFactory) {
        MqttPahoMessageHandler handler =
            new MqttPahoMessageHandler(CLIENT_ID_OUT, mqttClientFactory);
        handler.setAsync(true);
        handler.setDefaultQos(1);
        return handler;
    }
}
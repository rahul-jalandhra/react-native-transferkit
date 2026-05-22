#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface TransferkitEventEmitter
    : RCTEventEmitter

+ (instancetype)shared;

@end
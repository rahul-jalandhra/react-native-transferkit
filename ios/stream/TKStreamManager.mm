#import "TKStreamManager.h"

#import "../events/TransferkitEventEmitter.h"

@interface TKStreamManager ()

@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionDataTask *task;

@end

@implementation TKStreamManager

+ (instancetype)shared
{
    static TKStreamManager *sharedInstance = nil;

    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{

        sharedInstance =
            [[TKStreamManager alloc] init];
    });

    return sharedInstance;
}

- (void)startStream:(NSString *)url
             method:(NSString *)method
            headers:(NSDictionary *)headers
               body:(NSString *)body
{

    NSLog(@"startStream called");

    NSURL *requestURL =
        [NSURL URLWithString:url];

    if (!requestURL) {

        NSLog(@"Invalid URL");
        return;
    }

    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:requestURL];

    request.HTTPMethod = method;

    for (NSString *key in headers) {

        [request setValue:headers[key]
       forHTTPHeaderField:key];
    }

    if (![[method uppercaseString]
          isEqualToString:@"GET"]) {

        request.HTTPBody =
            [body dataUsingEncoding:
                NSUTF8StringEncoding];
    }

    NSURLSessionConfiguration *config =
        [NSURLSessionConfiguration
            defaultSessionConfiguration];

    self.session =
        [NSURLSession sessionWithConfiguration:config
                                      delegate:self
                                 delegateQueue:nil];

    self.task =
        [self.session dataTaskWithRequest:request];

    [self.task resume];
}

- (void)cancelStream
{
    [self.task cancel];

    self.task = nil;

    [[TransferkitEventEmitter shared]
        sendEventWithName:@"onStreamCancel"
                     body:@{
                        @"data": @"cancelled"
                     }];
}

#pragma mark - NSURLSessionDataDelegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data
{

    NSString *chunk =
        [[NSString alloc]
            initWithData:data
                encoding:NSUTF8StringEncoding];

    NSLog(@"Chunk: %@", chunk);

    [[TransferkitEventEmitter shared]
        sendEventWithName:@"onStreamData"
                     body:@{
                        @"data": chunk ?: @""
                     }];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error
{

    if (error) {

        NSLog(@"Stream Error: %@",
              error.localizedDescription);

        [[TransferkitEventEmitter shared]
            sendEventWithName:@"onStreamError"
                         body:@{
                            @"data":
                                error.localizedDescription
                                    ?: @"Unknown error"
                         }];

    } else {

        NSLog(@"Stream Complete");

        [[TransferkitEventEmitter shared]
            sendEventWithName:@"onStreamComplete"
                         body:@{
                            @"data": @"done"
                         }];
    }
}

@end